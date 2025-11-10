import { NotificationService } from './NotificationService';
import { EscalationService } from './ai/EscalationService';
import { UserModel } from '../models/User';
import { EscalationPriority, EscalationReason } from '../types/ai';
import logger from '../utils/logger';

export class AlertService {
  // Configuración de alertas
  private static config = {
    enabled: true,
    channels: ['email'], // Por ahora solo email, se puede expandir
    escalationAlerts: {
      urgent: { immediate: true, channels: ['email', 'sms'] },
      high: { immediate: true, channels: ['email'] },
      medium: { immediate: false, channels: ['email'] },
      low: { immediate: false, channels: ['email'] }
    },
    batchNotificationInterval: 300000, // 5 minutos
    maxAlertsPerHour: 20
  };

  // Control de rate limiting para alertas
  private static alertCounts = new Map<string, { count: number; resetTime: number }>();

  /**
   * Enviar alerta de escalación a agentes humanos
   */
  static async sendEscalationAlert(
    escalationId: string,
    conversationId: string,
    reason: EscalationReason,
    priority: EscalationPriority,
    clientId: string,
    summary: string
  ): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Alert service is disabled');
      return;
    }

    try {
      // Verificar rate limiting
      if (!this.checkAlertRateLimit('escalation')) {
        logger.warn('Escalation alert rate limit exceeded');
        return;
      }

      const alertConfig = this.config.escalationAlerts[priority];
      
      // Obtener agentes disponibles para notificar
      const availableAgents = await this.getAvailableAgents();
      
      if (availableAgents.length === 0) {
        logger.warn('No available agents to notify for escalation');
        return;
      }

      // Preparar datos de la alerta con información enriquecida
      const alertData = {
        escalationId,
        conversationId,
        reason,
        priority,
        clientId,
        summary: summary.substring(0, 200), // Limitar longitud
        timestamp: new Date().toISOString(),
        urgentAlert: priority === 'urgent' || priority === 'high',
        actionRequired: this.getRequiredActions(reason, priority),
        estimatedComplexity: this.estimateComplexity(reason, summary),
        suggestedResponse: this.getSuggestedResponse(reason)
      };

      // Enviar alertas según configuración
      for (const channel of alertConfig.channels) {
        if (alertConfig.immediate) {
          await this.sendImmediateAlert(availableAgents, channel, alertData);
        } else {
          await this.queueBatchAlert(availableAgents, channel, alertData);
        }
      }

      // Enviar notificación en tiempo real al dashboard
      await this.sendRealTimeNotification(alertData);

      logger.info(`Escalation alert sent: ${escalationId} (${priority})`, {
        reason,
        agentsNotified: availableAgents.length,
        channels: alertConfig.channels
      });

    } catch (error) {
      logger.error('Error sending escalation alert:', error);
    }
  }

  /**
   * Enviar alerta de intervención requerida
   */
  static async sendInterventionAlert(
    conversationId: string,
    clientId: string,
    interventionType: 'immediate' | 'scheduled' | 'followup',
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) return;

    try {
      if (!this.checkAlertRateLimit('intervention')) {
        logger.warn('Intervention alert rate limit exceeded');
        return;
      }

      const availableAgents = await this.getAvailableAgents();
      
      const alertData = {
        type: 'intervention_required',
        conversationId,
        clientId,
        interventionType,
        reason,
        metadata,
        timestamp: new Date().toISOString(),
        priority: interventionType === 'immediate' ? 'high' : 'medium'
      };

      // Enviar según tipo de intervención
      if (interventionType === 'immediate') {
        // Alerta inmediata a todos los agentes disponibles
        for (const agent of availableAgents) {
          await this.sendImmediateInterventionAlert(agent, alertData);
        }
      } else {
        // Notificación normal
        await this.sendRealTimeNotification(alertData);
      }

      logger.info(`Intervention alert sent: ${conversationId} (${interventionType})`, {
        reason,
        agentsNotified: availableAgents.length
      });

    } catch (error) {
      logger.error('Error sending intervention alert:', error);
    }
  }

  /**
   * Enviar alerta de sistema crítico
   */
  static async sendSystemAlert(
    type: 'high_error_rate' | 'service_down' | 'database_issue' | 'twilio_error',
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) return;

    try {
      if (!this.checkAlertRateLimit('system')) {
        logger.warn('System alert rate limit exceeded');
        return;
      }

      const availableAgents = await this.getAvailableAgents();
      
      const alertData = {
        type,
        message,
        metadata,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      };

      // Enviar alerta inmediata por todos los canales
      for (const agent of availableAgents) {
        for (const channel of this.config.channels) {
          await this.sendSystemNotification(agent, channel, alertData);
        }
      }

      logger.info(`System alert sent: ${type}`, { agentsNotified: availableAgents.length });

    } catch (error) {
      logger.error('Error sending system alert:', error);
    }
  }

  /**
   * Enviar resumen diario de escalaciones
   */
  static async sendDailySummary(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const stats = EscalationService.getEscalationStats();
      const availableAgents = await this.getAvailableAgents();

      if (stats.totalEscalations === 0) {
        logger.info('No escalations to report in daily summary');
        return;
      }

      const summaryData = {
        date: new Date().toLocaleDateString('es-ES'),
        totalEscalations: stats.totalEscalations,
        pendingEscalations: stats.pendingEscalations,
        resolvedEscalations: stats.resolvedEscalations,
        topReasons: Object.entries(stats.escalationsByReason)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3),
        priorityBreakdown: stats.escalationsByPriority
      };

      for (const agent of availableAgents) {
        await this.sendDailySummaryNotification(agent, summaryData);
      }

      logger.info('Daily escalation summary sent', { agentsNotified: availableAgents.length });

    } catch (error) {
      logger.error('Error sending daily summary:', error);
    }
  }

  // Métodos privados

  private static async getAvailableAgents(): Promise<any[]> {
    try {
      // Obtener usuarios con rol de manager o admin que estén activos
      const agents = await UserModel.getActiveManagers();
      return agents || [];
    } catch (error) {
      logger.error('Error getting available agents:', error);
      return [];
    }
  }

  private static async sendImmediateAlert(
    agents: any[],
    channel: string,
    alertData: any
  ): Promise<void> {
    for (const agent of agents) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(agent, alertData);
            break;
          case 'sms':
            await this.sendSMSAlert(agent, alertData);
            break;
          default:
            logger.warn(`Unsupported alert channel: ${channel}`);
        }
      } catch (error) {
        logger.error(`Error sending ${channel} alert to agent ${agent.id}:`, error);
      }
    }
  }

  private static async queueBatchAlert(
    agents: any[],
    channel: string,
    alertData: any
  ): Promise<void> {
    // Implementar cola de alertas por lotes
    logger.info(`Queued batch alert for ${agents.length} agents via ${channel}`);
    // TODO: Implementar sistema de cola real
  }

  private static async sendEmailAlert(agent: any, alertData: any): Promise<void> {
    // Simular envío de email
    logger.info(`Email alert sent to ${agent.email}:`, {
      escalationId: alertData.escalationId,
      priority: alertData.priority,
      reason: alertData.reason
    });

    // TODO: Integrar con servicio de email real
  }

  private static async sendSMSAlert(agent: any, alertData: any): Promise<void> {
    // Simular envío de SMS
    logger.info(`SMS alert sent to ${agent.phone}:`, {
      escalationId: alertData.escalationId,
      priority: alertData.priority
    });

    // TODO: Integrar con servicio de SMS real
  }

  private static async sendSystemNotification(agent: any, channel: string, alertData: any): Promise<void> {
    logger.info(`System notification sent to ${agent.email} via ${channel}:`, {
      type: alertData.type,
      severity: alertData.severity
    });

    // TODO: Implementar notificaciones de sistema reales
  }

  private static async sendDailySummaryNotification(agent: any, summaryData: any): Promise<void> {
    logger.info(`Daily summary sent to ${agent.email}:`, summaryData);

    // TODO: Implementar envío de resumen diario real
  }

  /**
   * Obtener acciones requeridas según el tipo de escalación
   */
  private static getRequiredActions(reason: EscalationReason, priority: EscalationPriority): string[] {
    const actions: string[] = [];

    switch (reason) {
      case 'complaint':
        actions.push('Revisar historial del cliente');
        actions.push('Preparar respuesta empática');
        actions.push('Considerar compensación si aplica');
        break;
      case 'payment_issue':
        actions.push('Verificar estado de pago');
        actions.push('Revisar políticas de reembolso');
        actions.push('Contactar departamento financiero si es necesario');
        break;
      case 'complex_request':
        actions.push('Analizar requerimientos específicos');
        actions.push('Consultar disponibilidad de servicios especiales');
        actions.push('Preparar cotización personalizada');
        break;
      case 'technical_issue':
        actions.push('Verificar logs del sistema');
        actions.push('Contactar soporte técnico si es necesario');
        break;
      default:
        actions.push('Revisar contexto completo de la conversación');
        actions.push('Responder de manera personalizada');
    }

    if (priority === 'urgent' || priority === 'high') {
      actions.unshift('RESPUESTA INMEDIATA REQUERIDA');
    }

    return actions;
  }

  /**
   * Estimar complejidad del caso
   */
  private static estimateComplexity(reason: EscalationReason, summary: string): 'low' | 'medium' | 'high' {
    const complexKeywords = ['múltiple', 'especial', 'urgente', 'complicado', 'excepción'];
    const keywordCount = complexKeywords.filter(keyword => 
      summary.toLowerCase().includes(keyword)
    ).length;

    if (reason === 'complaint' || reason === 'payment_issue') {
      return 'high';
    }

    if (keywordCount >= 2) {
      return 'high';
    } else if (keywordCount >= 1) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Obtener respuesta sugerida según el tipo de escalación
   */
  private static getSuggestedResponse(reason: EscalationReason): string {
    switch (reason) {
      case 'complaint':
        return 'Disculpe las molestias. Entiendo su preocupación y me haré cargo personalmente de resolver esta situación.';
      case 'payment_issue':
        return 'Permítame revisar el estado de su pago y resolver cualquier inconveniente de inmediato.';
      case 'complex_request':
        return 'Entiendo que tiene requerimientos específicos. Permítame analizar las opciones disponibles para usted.';
      case 'client_request':
        return 'Por supuesto, estoy aquí para ayudarle personalmente. ¿En qué puedo asistirle?';
      default:
        return 'Hola, soy un agente humano y estaré encantado de ayudarle con su consulta.';
    }
  }

  /**
   * Enviar notificación en tiempo real al dashboard
   */
  private static async sendRealTimeNotification(alertData: any): Promise<void> {
    try {
      const { RealTimeNotificationService } = await import('./RealTimeNotificationService');
      
      if (alertData.escalationId) {
        // Es una escalación
        await RealTimeNotificationService.sendEscalationNotification(
          alertData.escalationId,
          alertData.conversationId,
          alertData.reason,
          alertData.priority,
          alertData.clientId,
          alertData.summary,
          alertData.actionRequired
        );
      } else if (alertData.type === 'intervention_required') {
        // Es una intervención
        await RealTimeNotificationService.sendInterventionNotification(
          alertData.conversationId,
          alertData.clientId,
          alertData.interventionType,
          alertData.reason,
          alertData.metadata
        );
      } else {
        // Notificación del sistema
        await RealTimeNotificationService.sendSystemNotification(
          alertData.severity === 'critical' ? 'error' : 'warning',
          alertData.type || 'System Alert',
          alertData.message || alertData.summary,
          alertData.metadata
        );
      }
      
      logger.info('Real-time notification sent to dashboard:', {
        type: alertData.type || 'escalation',
        priority: alertData.priority,
        timestamp: alertData.timestamp
      });
    } catch (error) {
      logger.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Enviar alerta inmediata de intervención
   */
  private static async sendImmediateInterventionAlert(agent: any, alertData: any): Promise<void> {
    logger.info(`Immediate intervention alert sent to ${agent.email}:`, {
      conversationId: alertData.conversationId,
      interventionType: alertData.interventionType,
      reason: alertData.reason
    });

    // TODO: Implementar notificación push, SMS o llamada según la urgencia
  }

  private static checkAlertRateLimit(alertType: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hora
    
    const alertLimit = this.alertCounts.get(alertType);
    
    if (!alertLimit || now > alertLimit.resetTime) {
      // Nueva ventana de tiempo
      this.alertCounts.set(alertType, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (alertLimit.count >= this.config.maxAlertsPerHour) {
      return false;
    }

    alertLimit.count++;
    return true;
  }

  /**
   * Obtener configuración actual
   */
  static getConfig() {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(newConfig: Partial<typeof AlertService.config>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('AlertService configuration updated:', this.config);
  }

  /**
   * Obtener estadísticas de alertas
   */
  static getStats(): {
    totalAlertsSent: number;
    alertsByType: Record<string, number>;
    rateLimitStatus: Record<string, { count: number; remaining: number }>;
    config: typeof AlertService.config;
  } {
    const rateLimitStatus: Record<string, { count: number; remaining: number }> = {};
    
    for (const [alertType, limit] of this.alertCounts.entries()) {
      rateLimitStatus[alertType] = {
        count: limit.count,
        remaining: Math.max(0, this.config.maxAlertsPerHour - limit.count)
      };
    }

    const alertsByType: Record<string, number> = {};
    for (const [alertType, limit] of this.alertCounts.entries()) {
      alertsByType[alertType] = limit.count;
    }

    return {
      totalAlertsSent: Array.from(this.alertCounts.values()).reduce((sum, limit) => sum + limit.count, 0),
      alertsByType,
      rateLimitStatus,
      config: this.getConfig()
    };
  }

  /**
   * Inicializar servicio de alertas
   */
  static initialize(): void {
    logger.info('Alert service initialized');
    
    // Programar envío de resumen diario
    const dailySummaryTime = new Date();
    dailySummaryTime.setHours(9, 0, 0, 0); // 9:00 AM todos los días
    
    const now = new Date();
    let msUntilNextSummary = dailySummaryTime.getTime() - now.getTime();
    
    if (msUntilNextSummary < 0) {
      // Si ya pasó la hora de hoy, programar para mañana
      msUntilNextSummary += 24 * 60 * 60 * 1000;
    }

    setTimeout(() => {
      this.sendDailySummary();
      
      // Programar envío diario
      setInterval(() => {
        this.sendDailySummary();
      }, 24 * 60 * 60 * 1000);
      
    }, msUntilNextSummary);

    logger.info(`Daily summary scheduled for ${new Date(now.getTime() + msUntilNextSummary).toLocaleString()}`);
  }
}