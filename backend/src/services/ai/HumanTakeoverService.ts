import { ConversationModel } from '../../models/Conversation';
import { EscalationService } from './EscalationService';
import { ContextManager } from './ContextManager';
import { AlertService } from '../AlertService';
import { ConversationContext, Message } from '../../types/ai';
import logger from '../../utils/logger';

export interface HumanTakeoverSession {
  conversationId: string;
  humanAgentId: string;
  escalationId?: string;
  startTime: Date;
  status: 'active' | 'paused' | 'ended';
  clientId: string;
  channel: 'web' | 'whatsapp';
  context: ConversationContext;
}

export class HumanTakeoverService {
  // Sesiones activas de control humano
  private static activeSessions = new Map<string, HumanTakeoverSession>();

  /**
   * Iniciar toma de control manual de una conversación
   */
  static async startTakeover(
    conversationId: string,
    humanAgentId: string,
    escalationId?: string
  ): Promise<{
    success: boolean;
    sessionId?: string;
    message: string;
    session?: HumanTakeoverSession;
  }> {
    try {
      // Verificar que la conversación existe
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        return {
          success: false,
          message: 'Conversación no encontrada'
        };
      }

      // Verificar si ya hay una sesión activa
      const existingSession = Array.from(this.activeSessions.values())
        .find(session => session.conversationId === conversationId && session.status === 'active');

      if (existingSession) {
        if (existingSession.humanAgentId === humanAgentId) {
          return {
            success: true,
            sessionId: existingSession.conversationId,
            message: 'Ya tienes control de esta conversación',
            session: existingSession
          };
        } else {
          return {
            success: false,
            message: `La conversación ya está siendo controlada por otro agente`
          };
        }
      }

      // Crear nueva sesión de control
      const session: HumanTakeoverSession = {
        conversationId,
        humanAgentId,
        escalationId,
        startTime: new Date(),
        status: 'active',
        clientId: conversation.clientId,
        channel: conversation.channel,
        context: conversation.context
      };

      this.activeSessions.set(conversationId, session);

      // Actualizar el contexto de la conversación
      const updatedContext: ConversationContext = {
        ...conversation.context,
        humanAgentId,
        escalationReason: escalationId ? 'human_takeover' : conversation.context.escalationReason
      };

      await ConversationModel.updateContext(conversationId, updatedContext);
      await ConversationModel.updateStatus(conversationId, 'escalated');

      // Agregar mensaje del sistema
      await ConversationModel.addMessage(conversationId, {
        senderType: 'ai',
        content: `Un agente humano ha tomado control de la conversación. Te atenderá personalmente.`,
        metadata: {
          systemMessage: true,
          humanAgentId,
          takeoverTime: new Date().toISOString()
        }
      });

      logger.info(`Human takeover started: ${conversationId} by ${humanAgentId}`, {
        escalationId,
        clientId: conversation.clientId,
        channel: conversation.channel
      });

      return {
        success: true,
        sessionId: conversationId,
        message: 'Control tomado exitosamente',
        session
      };

    } catch (error) {
      logger.error('Error starting human takeover:', error);
      return {
        success: false,
        message: 'Error al tomar control de la conversación'
      };
    }
  }

  /**
   * Enviar mensaje como agente humano
   */
  static async sendHumanMessage(
    conversationId: string,
    humanAgentId: string,
    content: string,
    mediaUrl?: string
  ): Promise<{
    success: boolean;
    message: string;
    messageId?: string;
  }> {
    try {
      const session = this.activeSessions.get(conversationId);
      
      if (!session || session.humanAgentId !== humanAgentId || session.status !== 'active') {
        return {
          success: false,
          message: 'No tienes control activo de esta conversación'
        };
      }

      // Enviar mensaje
      const savedMessage = await ConversationModel.addMessage(conversationId, {
        senderType: 'human',
        content,
        mediaUrl,
        metadata: {
          humanAgentId,
          timestamp: new Date().toISOString()
        }
      });

      // Actualizar contexto con el nuevo mensaje
      const updatedContext = await ContextManager.addMessageToContext(conversationId, savedMessage);
      session.context = updatedContext;

      logger.info(`Human message sent: ${conversationId}`, {
        humanAgentId,
        messageLength: content.length,
        hasMedia: !!mediaUrl
      });

      return {
        success: true,
        message: 'Mensaje enviado exitosamente',
        messageId: savedMessage.id
      };

    } catch (error) {
      logger.error('Error sending human message:', error);
      return {
        success: false,
        message: 'Error al enviar mensaje'
      };
    }
  }

  /**
   * Pausar control humano (mantener sesión pero permitir que IA responda)
   */
  static async pauseTakeover(
    conversationId: string,
    humanAgentId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const session = this.activeSessions.get(conversationId);
      
      if (!session || session.humanAgentId !== humanAgentId) {
        return {
          success: false,
          message: 'No tienes control de esta conversación'
        };
      }

      session.status = 'paused';
      this.activeSessions.set(conversationId, session);

      // Actualizar estado de la conversación
      await ConversationModel.updateStatus(conversationId, 'active');

      // Mensaje del sistema
      await ConversationModel.addMessage(conversationId, {
        senderType: 'ai',
        content: `El agente humano ha pausado el control. Puedo continuar atendiéndote mientras tanto.`,
        metadata: {
          systemMessage: true,
          pausedBy: humanAgentId,
          pauseTime: new Date().toISOString()
        }
      });

      logger.info(`Human takeover paused: ${conversationId} by ${humanAgentId}`);

      return {
        success: true,
        message: 'Control pausado exitosamente'
      };

    } catch (error) {
      logger.error('Error pausing human takeover:', error);
      return {
        success: false,
        message: 'Error al pausar control'
      };
    }
  }

  /**
   * Reanudar control humano
   */
  static async resumeTakeover(
    conversationId: string,
    humanAgentId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const session = this.activeSessions.get(conversationId);
      
      if (!session || session.humanAgentId !== humanAgentId) {
        return {
          success: false,
          message: 'No tienes una sesión de control para esta conversación'
        };
      }

      session.status = 'active';
      this.activeSessions.set(conversationId, session);

      // Actualizar estado de la conversación
      await ConversationModel.updateStatus(conversationId, 'escalated');

      // Mensaje del sistema
      await ConversationModel.addMessage(conversationId, {
        senderType: 'ai',
        content: `El agente humano ha reanudado el control de la conversación.`,
        metadata: {
          systemMessage: true,
          resumedBy: humanAgentId,
          resumeTime: new Date().toISOString()
        }
      });

      logger.info(`Human takeover resumed: ${conversationId} by ${humanAgentId}`);

      return {
        success: true,
        message: 'Control reanudado exitosamente'
      };

    } catch (error) {
      logger.error('Error resuming human takeover:', error);
      return {
        success: false,
        message: 'Error al reanudar control'
      };
    }
  }

  /**
   * Finalizar control humano y devolver a IA
   */
  static async endTakeover(
    conversationId: string,
    humanAgentId: string,
    resolution?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const session = this.activeSessions.get(conversationId);
      
      if (!session || session.humanAgentId !== humanAgentId) {
        return {
          success: false,
          message: 'No tienes control de esta conversación'
        };
      }

      // Marcar sesión como finalizada
      session.status = 'ended';
      this.activeSessions.set(conversationId, session);

      // Actualizar contexto de la conversación
      const conversation = await ConversationModel.findById(conversationId);
      if (conversation) {
        const updatedContext: ConversationContext = {
          ...conversation.context,
          humanAgentId: undefined,
          escalationReason: undefined
        };

        await ConversationModel.updateContext(conversationId, updatedContext);
        await ConversationModel.updateStatus(conversationId, 'active');
      }

      // Resolver escalación si existe
      if (session.escalationId) {
        await EscalationService.resolveEscalation(
          session.escalationId,
          resolution || 'Conversación resuelta por agente humano',
          humanAgentId
        );
      }

      // Mensaje del sistema
      await ConversationModel.addMessage(conversationId, {
        senderType: 'ai',
        content: `La conversación ha sido devuelta al asistente automático. ¿En qué más puedo ayudarte?`,
        metadata: {
          systemMessage: true,
          endedBy: humanAgentId,
          endTime: new Date().toISOString(),
          resolution
        }
      });

      // Limpiar sesión después de un tiempo
      setTimeout(() => {
        this.activeSessions.delete(conversationId);
      }, 60 * 60 * 1000); // 1 hora

      logger.info(`Human takeover ended: ${conversationId} by ${humanAgentId}`, {
        duration: Date.now() - session.startTime.getTime(),
        resolution: resolution?.substring(0, 100)
      });

      return {
        success: true,
        message: 'Control finalizado exitosamente'
      };

    } catch (error) {
      logger.error('Error ending human takeover:', error);
      return {
        success: false,
        message: 'Error al finalizar control'
      };
    }
  }

  /**
   * Obtener sesión activa de un agente
   */
  static getActiveSession(conversationId: string): HumanTakeoverSession | null {
    return this.activeSessions.get(conversationId) || null;
  }

  /**
   * Obtener todas las sesiones activas de un agente
   */
  static getAgentSessions(humanAgentId: string): HumanTakeoverSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.humanAgentId === humanAgentId && session.status === 'active');
  }

  /**
   * Obtener estadísticas de sesiones
   */
  static getSessionStats(): {
    activeSessions: number;
    pausedSessions: number;
    totalSessions: number;
    sessionsByAgent: Record<string, number>;
    averageSessionDuration: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    
    const stats = {
      activeSessions: sessions.filter(s => s.status === 'active').length,
      pausedSessions: sessions.filter(s => s.status === 'paused').length,
      totalSessions: sessions.length,
      sessionsByAgent: {} as Record<string, number>,
      averageSessionDuration: 0
    };

    // Contar por agente
    sessions.forEach(session => {
      stats.sessionsByAgent[session.humanAgentId] = 
        (stats.sessionsByAgent[session.humanAgentId] || 0) + 1;
    });

    // Calcular duración promedio de sesiones finalizadas
    const endedSessions = sessions.filter(s => s.status === 'ended');
    if (endedSessions.length > 0) {
      const totalDuration = endedSessions.reduce((sum, session) => {
        return sum + (Date.now() - session.startTime.getTime());
      }, 0);
      stats.averageSessionDuration = totalDuration / endedSessions.length;
    }

    return stats;
  }

  /**
   * Verificar si una conversación está bajo control humano
   */
  static isUnderHumanControl(conversationId: string): boolean {
    const session = this.activeSessions.get(conversationId);
    return session?.status === 'active' || false;
  }

  /**
   * Limpiar sesiones inactivas
   */
  static cleanupInactiveSessions(hoursInactive: number = 24): number {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursInactive);

    let cleanedCount = 0;
    for (const [conversationId, session] of this.activeSessions.entries()) {
      if (session.startTime < cutoffTime && session.status === 'ended') {
        this.activeSessions.delete(conversationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} inactive human takeover sessions`);
    }

    return cleanedCount;
  }

  /**
   * Transferir control entre agentes
   */
  static async transferControl(
    conversationId: string,
    fromAgentId: string,
    toAgentId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const session = this.activeSessions.get(conversationId);
      
      if (!session || session.humanAgentId !== fromAgentId || session.status !== 'active') {
        return {
          success: false,
          message: 'No tienes control activo de esta conversación'
        };
      }

      // Actualizar sesión
      session.humanAgentId = toAgentId;
      this.activeSessions.set(conversationId, session);

      // Actualizar contexto de la conversación
      const conversation = await ConversationModel.findById(conversationId);
      if (conversation) {
        const updatedContext: ConversationContext = {
          ...conversation.context,
          humanAgentId: toAgentId
        };
        await ConversationModel.updateContext(conversationId, updatedContext);
      }

      // Mensaje del sistema
      await ConversationModel.addMessage(conversationId, {
        senderType: 'ai',
        content: `La conversación ha sido transferida a otro agente especializado.`,
        metadata: {
          systemMessage: true,
          transferFrom: fromAgentId,
          transferTo: toAgentId,
          transferTime: new Date().toISOString(),
          reason
        }
      });

      logger.info(`Control transferred: ${conversationId} from ${fromAgentId} to ${toAgentId}`, {
        reason
      });

      return {
        success: true,
        message: 'Control transferido exitosamente'
      };

    } catch (error) {
      logger.error('Error transferring control:', error);
      return {
        success: false,
        message: 'Error al transferir control'
      };
    }
  }
}