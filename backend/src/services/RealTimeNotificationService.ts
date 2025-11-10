import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { EscalationPriority, EscalationReason } from '../types/ai';
import { authenticateSocketToken } from '../middleware/auth';
import logger from '../utils/logger';

export interface NotificationData {
  type: 'escalation' | 'intervention' | 'system' | 'takeover';
  id: string;
  title: string;
  message: string;
  priority: EscalationPriority | 'info';
  timestamp: Date;
  data?: Record<string, any>;
  actionRequired?: boolean;
  autoExpire?: number; // seconds
}

export class RealTimeNotificationService {
  private static io: SocketIOServer | null = null;
  private static connectedUsers = new Map<string, string>(); // socketId -> userId
  private static userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  /**
   * Inicializar el servicio de notificaciones en tiempo real
   */
  static initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.DASHBOARD_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io'
    });

    // Middleware de autenticación para sockets
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('No token provided'));
        }

        const decoded = await authenticateSocketToken(token);
        socket.data.userId = decoded.userId;
        socket.data.userRole = decoded.role;
        
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      
      logger.info(`User connected to real-time notifications: ${userId}`);
      
      // Registrar conexión
      this.connectedUsers.set(socket.id, userId);
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Enviar notificaciones pendientes al conectarse
      this.sendPendingNotifications(userId);

      // Manejar eventos del cliente
      socket.on('mark_notification_read', (notificationId: string) => {
        this.markNotificationAsRead(userId, notificationId);
      });

      socket.on('request_escalation_update', () => {
        this.sendEscalationUpdate(userId);
      });

      socket.on('join_escalation_room', (escalationId: string) => {
        socket.join(`escalation_${escalationId}`);
        logger.info(`User ${userId} joined escalation room: ${escalationId}`);
      });

      socket.on('leave_escalation_room', (escalationId: string) => {
        socket.leave(`escalation_${escalationId}`);
        logger.info(`User ${userId} left escalation room: ${escalationId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`User disconnected from real-time notifications: ${userId}`);
        
        // Limpiar registros
        this.connectedUsers.delete(socket.id);
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });
    });

    logger.info('Real-time notification service initialized');
  }

  /**
   * Enviar notificación de escalación
   */
  static async sendEscalationNotification(
    escalationId: string,
    conversationId: string,
    reason: EscalationReason,
    priority: EscalationPriority,
    clientId: string,
    summary: string,
    actionRequired: string[] = []
  ): Promise<void> {
    if (!this.io) {
      logger.warn('Real-time notification service not initialized');
      return;
    }

    const notification: NotificationData = {
      type: 'escalation',
      id: escalationId,
      title: `Nueva Escalación - ${this.getPriorityLabel(priority)}`,
      message: `${this.getReasonLabel(reason)}: ${summary.substring(0, 100)}...`,
      priority,
      timestamp: new Date(),
      data: {
        escalationId,
        conversationId,
        reason,
        clientId,
        actionRequired
      },
      actionRequired: true,
      autoExpire: priority === 'urgent' ? undefined : 300 // 5 minutos para no urgentes
    };

    // Enviar a todos los usuarios conectados con permisos
    this.broadcastToAuthorizedUsers(notification);

    // Enviar a sala específica de escalación
    this.io.to(`escalation_${escalationId}`).emit('escalation_update', {
      escalationId,
      status: 'new',
      priority,
      timestamp: new Date()
    });

    logger.info(`Escalation notification sent: ${escalationId}`, {
      priority,
      reason,
      connectedUsers: this.connectedUsers.size
    });
  }

  /**
   * Enviar notificación de intervención requerida
   */
  static async sendInterventionNotification(
    conversationId: string,
    clientId: string,
    interventionType: 'immediate' | 'scheduled' | 'followup',
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.io) return;

    const priority = interventionType === 'immediate' ? 'urgent' : 'medium';
    
    const notification: NotificationData = {
      type: 'intervention',
      id: `intervention_${conversationId}_${Date.now()}`,
      title: `Intervención ${interventionType === 'immediate' ? 'Inmediata' : 'Requerida'}`,
      message: reason,
      priority,
      timestamp: new Date(),
      data: {
        conversationId,
        clientId,
        interventionType,
        metadata
      },
      actionRequired: interventionType === 'immediate',
      autoExpire: interventionType === 'immediate' ? undefined : 180
    };

    this.broadcastToAuthorizedUsers(notification);

    logger.info(`Intervention notification sent: ${conversationId}`, {
      interventionType,
      priority
    });
  }

  /**
   * Enviar notificación de toma de control
   */
  static async sendTakeoverNotification(
    conversationId: string,
    humanAgentId: string,
    clientId: string,
    action: 'started' | 'ended' | 'transferred'
  ): Promise<void> {
    if (!this.io) return;

    const notification: NotificationData = {
      type: 'takeover',
      id: `takeover_${conversationId}_${Date.now()}`,
      title: `Control ${action === 'started' ? 'Iniciado' : action === 'ended' ? 'Finalizado' : 'Transferido'}`,
      message: `Conversación ${conversationId} - Agente: ${humanAgentId}`,
      priority: 'info',
      timestamp: new Date(),
      data: {
        conversationId,
        humanAgentId,
        clientId,
        action
      },
      actionRequired: false,
      autoExpire: 60
    };

    // Enviar solo a usuarios relevantes
    this.sendToUser(humanAgentId, notification);
    
    // Notificar a supervisores
    this.broadcastToRole(['admin', 'manager'], notification);

    logger.info(`Takeover notification sent: ${conversationId}`, {
      action,
      humanAgentId
    });
  }

  /**
   * Enviar notificación del sistema
   */
  static async sendSystemNotification(
    type: 'error' | 'warning' | 'info' | 'success',
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.io) return;

    const notification: NotificationData = {
      type: 'system',
      id: `system_${Date.now()}`,
      title,
      message,
      priority: type === 'error' ? 'high' : type === 'warning' ? 'medium' : 'info',
      timestamp: new Date(),
      data: metadata,
      actionRequired: type === 'error',
      autoExpire: type === 'info' ? 30 : type === 'success' ? 10 : undefined
    };

    this.broadcastToAuthorizedUsers(notification);

    logger.info(`System notification sent: ${type}`, { title, message });
  }

  /**
   * Enviar actualización de estado de escalación
   */
  static async sendEscalationStatusUpdate(
    escalationId: string,
    status: 'assigned' | 'resolved' | 'escalated',
    humanAgentId?: string,
    resolution?: string
  ): Promise<void> {
    if (!this.io) return;

    const updateData = {
      escalationId,
      status,
      humanAgentId,
      resolution,
      timestamp: new Date()
    };

    // Enviar a sala específica de escalación
    this.io.to(`escalation_${escalationId}`).emit('escalation_status_update', updateData);

    // Enviar notificación general
    const notification: NotificationData = {
      type: 'escalation',
      id: `escalation_update_${escalationId}_${Date.now()}`,
      title: `Escalación ${status === 'resolved' ? 'Resuelta' : 'Actualizada'}`,
      message: `Escalación ${escalationId} ha sido ${status}`,
      priority: 'info',
      timestamp: new Date(),
      data: updateData,
      actionRequired: false,
      autoExpire: 60
    };

    this.broadcastToAuthorizedUsers(notification);

    logger.info(`Escalation status update sent: ${escalationId}`, { status, humanAgentId });
  }

  // Métodos privados

  private static broadcastToAuthorizedUsers(notification: NotificationData): void {
    if (!this.io) return;

    // Enviar a todos los usuarios conectados (en el futuro se puede filtrar por roles)
    this.io.emit('notification', notification);
  }

  private static broadcastToRole(roles: string[], notification: NotificationData): void {
    if (!this.io) return;

    for (const [socketId, userId] of this.connectedUsers.entries()) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && roles.includes(socket.data.userRole)) {
        socket.emit('notification', notification);
      }
    }
  }

  private static sendToUser(userId: string, notification: NotificationData): void {
    if (!this.io) return;

    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      for (const socketId of userSocketSet) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('notification', notification);
        }
      }
    }
  }

  private static async sendPendingNotifications(userId: string): Promise<void> {
    // TODO: Implementar recuperación de notificaciones pendientes desde base de datos
    logger.info(`Sending pending notifications to user: ${userId}`);
  }

  private static async sendEscalationUpdate(userId: string): Promise<void> {
    // TODO: Implementar envío de actualización de escalaciones
    logger.info(`Sending escalation update to user: ${userId}`);
  }

  private static markNotificationAsRead(userId: string, notificationId: string): void {
    // TODO: Implementar marcado de notificación como leída
    logger.info(`Notification marked as read: ${notificationId} by ${userId}`);
  }

  private static getPriorityLabel(priority: EscalationPriority): string {
    const labels = {
      urgent: 'URGENTE',
      high: 'ALTA',
      medium: 'MEDIA',
      low: 'BAJA'
    };
    return labels[priority] || priority.toUpperCase();
  }

  private static getReasonLabel(reason: EscalationReason): string {
    const labels = {
      low_confidence: 'Baja Confianza',
      failed_attempts: 'Intentos Fallidos',
      complaint: 'Queja',
      complex_request: 'Solicitud Compleja',
      technical_issue: 'Problema Técnico',
      payment_issue: 'Problema de Pago',
      client_request: 'Solicitud del Cliente'
    };
    return labels[reason] || reason.replace('_', ' ').toUpperCase();
  }

  /**
   * Obtener estadísticas de conexiones
   */
  static getConnectionStats(): {
    connectedUsers: number;
    totalSockets: number;
    userConnections: Record<string, number>;
  } {
    const userConnections: Record<string, number> = {};
    
    for (const [userId, socketSet] of this.userSockets.entries()) {
      userConnections[userId] = socketSet.size;
    }

    return {
      connectedUsers: this.userSockets.size,
      totalSockets: this.connectedUsers.size,
      userConnections
    };
  }

  /**
   * Cerrar el servicio
   */
  static close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.connectedUsers.clear();
      this.userSockets.clear();
      logger.info('Real-time notification service closed');
    }
  }
}