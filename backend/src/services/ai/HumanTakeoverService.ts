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
  lastHumanMessageTime?: Date; // Timestamp del último mensaje enviado por el humano
  status: 'active' | 'paused' | 'ended';
  clientId: string;
  channel: 'web' | 'whatsapp';
  context: ConversationContext;
}

export class HumanTakeoverService {
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

      // Check if already under human control (from database)
      const existingState = await ConversationModel.getHumanTakeoverState(conversationId);
      if (existingState?.active) {
        if (existingState.agentId === humanAgentId) {
          // Build session object for backward compatibility
          const session: HumanTakeoverSession = {
            conversationId,
            humanAgentId,
            escalationId,
            startTime: existingState.lastMessageTime || new Date(),
            lastHumanMessageTime: existingState.lastMessageTime || undefined,
            status: 'active',
            clientId: conversation.clientId,
            channel: conversation.channel,
            context: conversation.context
          };
          
          return {
            success: true,
            sessionId: conversationId,
            message: 'Ya tienes control de esta conversación',
            session
          };
        } else {
          return {
            success: false,
            message: `La conversación ya está siendo controlada por otro agente`
          };
        }
      }

      // Persist to database
      await ConversationModel.setHumanTakeover(conversationId, humanAgentId, true);

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

      // Build session object for backward compatibility
      const session: HumanTakeoverSession = {
        conversationId,
        humanAgentId,
        escalationId,
        startTime: new Date(),
        status: 'active',
        clientId: conversation.clientId,
        channel: conversation.channel,
        context: updatedContext
      };

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
      // Check database for takeover state
      const state = await ConversationModel.getHumanTakeoverState(conversationId);
      
      if (!state || !state.active || state.agentId !== humanAgentId) {
        return {
          success: false,
          message: 'No tienes control activo de esta conversación'
        };
      }

      // Obtener información de la conversación para enviar por el canal correcto
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        return {
          success: false,
          message: 'Conversación no encontrada'
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

      // 📤 ENVIAR MENSAJE AL CLIENTE POR EL CANAL CORRESPONDIENTE
      if (conversation.channel === 'whatsapp') {
        try {
          logger.info(`📤 Attempting to send human message via WhatsApp for conversation ${conversationId}`, {
            conversationId,
            clientId: conversation.clientId,
            messageLength: content.length
          });
          
          const { TwilioService } = await import('../TwilioService');
          const { ClientModel } = await import('../../models/Client');
          
          // Verificar que TwilioService esté inicializado
          const twilioConfig = TwilioService.getConfig();
          logger.info(`🔧 Twilio config check:`, {
            hasAccountSid: !!twilioConfig.accountSid,
            accountSidPrefix: twilioConfig.accountSid?.substring(0, 5),
            hasPhoneNumber: !!twilioConfig.phoneNumber,
            phoneNumber: twilioConfig.phoneNumber
          });
          
          // Obtener el cliente para conseguir su número de teléfono
          const client = await ClientModel.findById(conversation.clientId);
          
          if (!client) {
            logger.error(`❌ Client not found: ${conversation.clientId}`);
            return {
              success: false,
              message: 'Cliente no encontrado - no se pudo enviar WhatsApp'
            };
          }
          
          if (!client.phone) {
            logger.error(`❌ Client ${conversation.clientId} has no phone number`);
            return {
              success: false,
              message: 'Cliente sin número de teléfono - no se pudo enviar WhatsApp'
            };
          }
          
          logger.info(`📞 Sending WhatsApp message to client`, {
            clientId: client.id,
            clientName: client.name,
            clientPhone: client.phone,
            messagePreview: content.substring(0, 30) + '...'
          });
          
          const twilioResult = await TwilioService.sendWhatsAppMessage({
            to: client.phone,
            body: content,
            mediaUrl
          });
          
          if (!twilioResult.success) {
            logger.error(`❌ Failed to send WhatsApp message via Twilio:`, {
              error: twilioResult.error,
              clientPhone: client.phone,
              clientId: client.id,
              messageContent: content.substring(0, 50)
            });
            // No retornar error aquí, el mensaje ya se guardó en BD
          } else {
            logger.info(`✅ WhatsApp message sent successfully via Twilio`, {
              messageSid: twilioResult.messageSid,
              clientPhone: client.phone,
              clientId: client.id,
              clientName: client.name
            });
          }
        } catch (twilioError: any) {
          logger.error('❌ Error sending message via Twilio:', {
            error: twilioError.message,
            stack: twilioError.stack,
            conversationId,
            clientId: conversation.clientId
          });
          // No retornar error aquí, el mensaje ya se guardó en BD
        }
      }

      // Actualizar contexto con el nuevo mensaje
      await ContextManager.addMessageToContext(conversationId, savedMessage);

      // ⏰ ACTUALIZAR TIMESTAMP DEL ÚLTIMO MENSAJE HUMANO EN LA BASE DE DATOS
      // Esto hará que el bot no responda por 1 hora
      await ConversationModel.updateLastHumanMessageTime(conversationId);

      logger.info(`Human message sent: ${conversationId}`, {
        humanAgentId,
        messageLength: content.length,
        hasMedia: !!mediaUrl,
        channel: conversation.channel
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
      // Check database for takeover state
      const state = await ConversationModel.getHumanTakeoverState(conversationId);
      
      if (!state || !state.active || state.agentId !== humanAgentId) {
        return {
          success: false,
          message: 'No tienes control de esta conversación'
        };
      }

      // Deactivate takeover in database (pause = deactivate)
      await ConversationModel.setHumanTakeover(conversationId, humanAgentId, false);

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
      // Check if conversation exists
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        return {
          success: false,
          message: 'Conversación no encontrada'
        };
      }

      // Reactivate takeover in database
      await ConversationModel.setHumanTakeover(conversationId, humanAgentId, true);

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
      // Check database for takeover state
      const state = await ConversationModel.getHumanTakeoverState(conversationId);
      
      if (!state || !state.active || state.agentId !== humanAgentId) {
        return {
          success: false,
          message: 'No tienes control de esta conversación'
        };
      }

      // Clear takeover state in database
      await ConversationModel.setHumanTakeover(conversationId, humanAgentId, false);

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

      // Resolver escalación si existe (check from conversation context)
      if (conversation?.context.escalationReason) {
        // Try to find escalation ID from context or messages
        const escalationId = conversation.context.escalationReason;
        if (escalationId && escalationId !== 'human_takeover') {
          await EscalationService.resolveEscalation(
            escalationId,
            resolution || 'Conversación resuelta por agente humano',
            humanAgentId
          );
        }
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

      logger.info(`Human takeover ended: ${conversationId} by ${humanAgentId}`, {
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
  static async getActiveSession(conversationId: string): Promise<HumanTakeoverSession | null> {
    try {
      const state = await ConversationModel.getHumanTakeoverState(conversationId);
      
      if (!state || !state.active) {
        return null;
      }

      // Get full conversation details to build session object
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        return null;
      }

      return {
        conversationId,
        humanAgentId: state.agentId!,
        startTime: state.lastMessageTime || new Date(),
        lastHumanMessageTime: state.lastMessageTime || undefined,
        status: 'active',
        clientId: conversation.clientId,
        channel: conversation.channel,
        context: conversation.context
      };
    } catch (error) {
      logger.error('Error getting active session:', error);
      return null;
    }
  }

  /**
   * Obtener todas las sesiones activas de un agente
   */
  static async getAgentSessions(humanAgentId: string): Promise<HumanTakeoverSession[]> {
    try {
      // Query database for all conversations with active takeover by this agent
      const conversations = await ConversationModel.findByHumanAgent(humanAgentId);
      
      return conversations.map(conversation => ({
        conversationId: conversation.id,
        humanAgentId,
        startTime: conversation.lastHumanMessageTime || new Date(),
        lastHumanMessageTime: conversation.lastHumanMessageTime || undefined,
        status: 'active' as const,
        clientId: conversation.clientId,
        channel: conversation.channel,
        context: conversation.context
      }));
    } catch (error) {
      logger.error('Error getting agent sessions:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de sesiones
   */
  static async getSessionStats(): Promise<{
    activeSessions: number;
    pausedSessions: number;
    totalSessions: number;
    sessionsByAgent: Record<string, number>;
    averageSessionDuration: number;
  }> {
    try {
      // Query database for all active takeover sessions
      const activeConversations = await ConversationModel.findAllWithActiveTakeover();
      
      const stats = {
        activeSessions: activeConversations.length,
        pausedSessions: 0, // No longer tracking paused state separately
        totalSessions: activeConversations.length,
        sessionsByAgent: {} as Record<string, number>,
        averageSessionDuration: 0
      };

      // Count by agent
      activeConversations.forEach(conversation => {
        const agentId = conversation.humanTakeoverAgentId!;
        stats.sessionsByAgent[agentId] = (stats.sessionsByAgent[agentId] || 0) + 1;
      });

      // Calculate average session duration
      if (activeConversations.length > 0) {
        const totalDuration = activeConversations.reduce((sum, conversation) => {
          const startTime = conversation.lastHumanMessageTime || new Date();
          return sum + (Date.now() - startTime.getTime());
        }, 0);
        stats.averageSessionDuration = totalDuration / activeConversations.length;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting session stats:', error);
      return {
        activeSessions: 0,
        pausedSessions: 0,
        totalSessions: 0,
        sessionsByAgent: {},
        averageSessionDuration: 0
      };
    }
  }

  /**
   * Verificar si una conversación está bajo control humano
   * Retorna true si human_takeover_active está en true en la BD
   * NO hay auto-desactivación por tiempo - solo manual desde el dashboard
   */
  static async isUnderHumanControl(conversationId: string): Promise<boolean> {
    try {
      // Query database for takeover state
      const state = await ConversationModel.getHumanTakeoverState(conversationId);
      
      if (!state || !state.active) {
        return false;
      }

      // Si está activo, está bajo control humano - sin importar el tiempo transcurrido
      // Solo se desactiva manualmente desde el dashboard
      return true;
    } catch (error) {
      logger.error('Database error checking human takeover state:', error);
      // Default to false to allow AI responses on database errors
      return false;
    }
  }

  /**
   * Limpiar sesiones inactivas
   */
  static async cleanupInactiveSessions(hoursInactive: number = 24): Promise<number> {
    try {
      // Use database cleanup for expired sessions
      const cleanedCount = await ConversationModel.clearExpiredTakeovers();

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} inactive human takeover sessions`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up inactive sessions:', error);
      return 0;
    }
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
      // Check database for takeover state
      const state = await ConversationModel.getHumanTakeoverState(conversationId);
      
      if (!state || !state.active || state.agentId !== fromAgentId) {
        return {
          success: false,
          message: 'No tienes control activo de esta conversación'
        };
      }

      // Update takeover to new agent in database
      await ConversationModel.setHumanTakeover(conversationId, toAgentId, true);

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