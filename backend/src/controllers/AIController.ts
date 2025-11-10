import { Request, Response } from 'express';
import { MessageRouter } from '../services/ai/MessageRouter';
import { ContextManager } from '../services/ai/ContextManager';
import { NLUService } from '../services/ai/NLUService';
// import { DialogManager } from '../services/ai/DialogManager';
import { ConversationModel } from '../models/Conversation';
import { ProcessMessageRequest } from '../types/ai';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class AIController {
  // Procesamiento de mensajes
  static async processMessage(req: Request, res: Response): Promise<void> {
    try {
      const messageRequest: ProcessMessageRequest = req.body;
      
      const result = await MessageRouter.processMessage(messageRequest);
      
      res.json({
        success: true,
        message: 'Mensaje procesado exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Process message error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al procesar mensaje'
      });
    }
  }

  // Webhook de Twilio WhatsApp
  static async twilioWebhook(req: Request, res: Response): Promise<void> {
    try {
      const twilioPayload = req.body;
      
      // Validar que es un mensaje entrante
      if (!twilioPayload.Body && !twilioPayload.MediaUrl0) {
        res.status(200).send('OK'); // Responder OK para otros tipos de webhook
        return;
      }

      const result = await MessageRouter.processWhatsAppMessage(twilioPayload);
      
      // Responder a Twilio con el mensaje del AI
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>${result.response.message}</Message>
        </Response>`;
      
      res.set('Content-Type', 'text/xml');
      res.send(twimlResponse);
      
      logger.info(`WhatsApp message processed: ${result.conversationId}`);
    } catch (error: any) {
      logger.error('Twilio webhook error:', error);
      
      // Responder con mensaje de error genérico
      const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>Lo siento, ha ocurrido un error. Un agente te contactará pronto.</Message>
        </Response>`;
      
      res.set('Content-Type', 'text/xml');
      res.send(errorResponse);
    }
  }

  // Gestión de conversaciones
  static async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId, channel, status, limit = 50 } = req.query;
      
      let conversations;
      
      if (clientId) {
        conversations = await ConversationModel.getConversationsByClient(
          clientId as string, 
          parseInt(limit as string)
        );
      } else {
        conversations = await ConversationModel.getActiveConversations(
          parseInt(limit as string)
        );
      }

      // Filtrar por canal y estado si se especifica
      if (channel || status) {
        conversations = conversations.filter(conv => {
          if (channel && conv.channel !== channel) return false;
          if (status && conv.status !== status) return false;
          return true;
        });
      }

      res.json({
        success: true,
        message: 'Conversaciones obtenidas exitosamente',
        data: conversations
      });
    } catch (error: any) {
      logger.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener conversaciones'
      });
    }
  }

  static async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeMessages = 'true' } = req.query;
      
      const conversation = await ConversationModel.findById(id);
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
        return;
      }

      let messages: any[] = [];
      if (includeMessages === 'true') {
        messages = await ConversationModel.getMessages(id, 100);
      }

      res.json({
        success: true,
        message: 'Conversación obtenida exitosamente',
        data: {
          conversation,
          messages
        }
      });
    } catch (error: any) {
      logger.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener conversación'
      });
    }
  }

  static async escalateConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, humanAgentId } = req.body;
      
      const conversation = await ConversationModel.escalateConversation(
        id, 
        reason || 'Manual escalation', 
        humanAgentId
      );
      
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Conversación escalada exitosamente',
        data: conversation
      });
    } catch (error: any) {
      logger.error('Escalate conversation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al escalar conversación'
      });
    }
  }

  static async closeConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const conversation = await ConversationModel.closeConversation(id);
      
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Conversación cerrada exitosamente',
        data: conversation
      });
    } catch (error: any) {
      logger.error('Close conversation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al cerrar conversación'
      });
    }
  }

  // Gestión de contexto
  static async getContext(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      
      const context = await ContextManager.getContext(conversationId);
      
      res.json({
        success: true,
        message: 'Contexto obtenido exitosamente',
        data: context
      });
    } catch (error: any) {
      logger.error('Get context error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener contexto'
      });
    }
  }

  static async updateContext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const contextUpdates = req.body;
      
      const updatedContext = await ContextManager.updateContext(conversationId, contextUpdates);
      
      res.json({
        success: true,
        message: 'Contexto actualizado exitosamente',
        data: updatedContext
      });
    } catch (error: any) {
      logger.error('Update context error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar contexto'
      });
    }
  }

  static async clearContext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      
      const clearedContext = await ContextManager.clearContext(conversationId);
      
      res.json({
        success: true,
        message: 'Contexto limpiado exitosamente',
        data: clearedContext
      });
    } catch (error: any) {
      logger.error('Clear context error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al limpiar contexto'
      });
    }
  }

  // Análisis y estadísticas
  static async analyzeMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, conversationId } = req.body;
      
      if (!message) {
        res.status(400).json({
          success: false,
          error: 'Mensaje es requerido'
        });
        return;
      }

      let context;
      if (conversationId) {
        context = await ContextManager.getContext(conversationId);
      }

      const analysis = await NLUService.processMessage(message, context);
      
      res.json({
        success: true,
        message: 'Mensaje analizado exitosamente',
        data: analysis
      });
    } catch (error: any) {
      logger.error('Analyze message error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al analizar mensaje'
      });
    }
  }

  static async getAIStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      
      const [conversationStats, routerStats, contextStats, nluStats] = await Promise.all([
        ConversationModel.getConversationStats(dateFrom, dateTo),
        MessageRouter.getStats(),
        ContextManager.getStats(),
        NLUService.getStats()
      ]);

      res.json({
        success: true,
        message: 'Estadísticas de IA obtenidas exitosamente',
        data: {
          conversations: conversationStats,
          messageRouter: routerStats,
          contextManager: contextStats,
          nlu: nluStats
        }
      });
    } catch (error: any) {
      logger.error('Get AI stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  // Configuración
  static async getConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = {
        messageRouter: MessageRouter.getConfig(),
        contextManager: ContextManager.getConfig(),
        nlu: NLUService.getConfig()
        // dialogManager: DialogManager.getConfig()
      };

      res.json({
        success: true,
        message: 'Configuración obtenida exitosamente',
        data: config
      });
    } catch (error: any) {
      logger.error('Get config error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener configuración'
      });
    }
  }

  static async updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { component, config } = req.body;
      
      switch (component) {
        case 'messageRouter':
          MessageRouter.updateConfig(config);
          break;
        case 'contextManager':
          ContextManager.updateConfig(config);
          break;
        case 'nlu':
          NLUService.updateConfig(config);
          break;
        // case 'dialogManager':
        //   DialogManager.updateConfig(config);
        //   break;
        default:
          res.status(400).json({
            success: false,
            error: 'Componente no válido'
          });
          return;
      }

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente'
      });
    } catch (error: any) {
      logger.error('Update config error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar configuración'
      });
    }
  }

  // Entrenamiento y mejora
  static async trainNLU(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, expectedIntent, expectedEntities } = req.body;
      
      if (!message || !expectedIntent) {
        res.status(400).json({
          success: false,
          error: 'Mensaje e intención esperada son requeridos'
        });
        return;
      }

      NLUService.trainWithExample(message, expectedIntent, expectedEntities || []);
      
      res.json({
        success: true,
        message: 'Ejemplo de entrenamiento agregado exitosamente'
      });
    } catch (error: any) {
      logger.error('Train NLU error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al entrenar NLU'
      });
    }
  }

  // Limpieza y mantenimiento
  static async cleanupInactiveConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { hoursInactive = 24 } = req.body;
      
      const cleanedCount = await ConversationModel.cleanupInactiveConversations(hoursInactive);
      
      res.json({
        success: true,
        message: 'Limpieza completada exitosamente',
        data: { cleanedConversations: cleanedCount }
      });
    } catch (error: any) {
      logger.error('Cleanup conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en la limpieza'
      });
    }
  }
}