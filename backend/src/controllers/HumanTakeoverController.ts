import { Response } from 'express';
import { HumanTakeoverService } from '../services/ai/HumanTakeoverService';
import { ConversationModel } from '../models/Conversation';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class HumanTakeoverController {
  /**
   * Iniciar toma de control de una conversación
   */
  static async startTakeover(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { escalationId } = req.body;
      const humanAgentId = req.user?.userId;

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const result = await HumanTakeoverService.startTakeover(
        conversationId,
        humanAgentId,
        escalationId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            sessionId: result.sessionId,
            session: result.session
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error: any) {
      logger.error('Start takeover error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al iniciar control'
      });
    }
  }

  /**
   * Enviar mensaje como agente humano
   */
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { content, mediaUrl } = req.body;
      const humanAgentId = req.user?.userId;

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'El contenido del mensaje es requerido'
        });
        return;
      }

      const result = await HumanTakeoverService.sendHumanMessage(
        conversationId,
        humanAgentId,
        content.trim(),
        mediaUrl
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: { messageId: result.messageId }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error: any) {
      logger.error('Send human message error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar mensaje'
      });
    }
  }

  /**
   * Pausar control humano
   */
  static async pauseTakeover(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const humanAgentId = req.user?.userId;

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const result = await HumanTakeoverService.pauseTakeover(conversationId, humanAgentId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error: any) {
      logger.error('Pause takeover error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al pausar control'
      });
    }
  }

  /**
   * Reanudar control humano
   */
  static async resumeTakeover(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const humanAgentId = req.user?.userId;

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const result = await HumanTakeoverService.resumeTakeover(conversationId, humanAgentId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error: any) {
      logger.error('Resume takeover error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al reanudar control'
      });
    }
  }

  /**
   * Finalizar control humano
   */
  static async endTakeover(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { resolution } = req.body;
      const humanAgentId = req.user?.userId;

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const result = await HumanTakeoverService.endTakeover(
        conversationId,
        humanAgentId,
        resolution
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error: any) {
      logger.error('End takeover error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al finalizar control'
      });
    }
  }

  /**
   * Obtener sesión activa de una conversación
   */
  static async getSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      const session = HumanTakeoverService.getActiveSession(conversationId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'No hay sesión activa para esta conversación'
        });
        return;
      }

      // Obtener mensajes recientes de la conversación
      const messages = await ConversationModel.getMessages(conversationId, 50);

      res.json({
        success: true,
        message: 'Sesión obtenida exitosamente',
        data: {
          session,
          messages
        }
      });
    } catch (error: any) {
      logger.error('Get session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener sesión'
      });
    }
  }

  /**
   * Obtener sesiones activas del agente actual
   */
  static async getMySessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const humanAgentId = req.user?.userId;

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const sessions = HumanTakeoverService.getAgentSessions(humanAgentId);

      res.json({
        success: true,
        message: 'Sesiones obtenidas exitosamente',
        data: sessions
      });
    } catch (error: any) {
      logger.error('Get my sessions error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener sesiones'
      });
    }
  }

  /**
   * Transferir control a otro agente
   */
  static async transferControl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { toAgentId, reason } = req.body;
      const fromAgentId = req.user?.userId;

      if (!fromAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      if (!toAgentId) {
        res.status(400).json({
          success: false,
          error: 'El ID del agente destino es requerido'
        });
        return;
      }

      const result = await HumanTakeoverService.transferControl(
        conversationId,
        fromAgentId,
        toAgentId,
        reason
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error: any) {
      logger.error('Transfer control error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al transferir control'
      });
    }
  }

  /**
   * Obtener estadísticas de sesiones
   */
  static async getSessionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = HumanTakeoverService.getSessionStats();

      res.json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get session stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Verificar si una conversación está bajo control humano
   */
  static async checkHumanControl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      const isUnderControl = HumanTakeoverService.isUnderHumanControl(conversationId);
      const session = HumanTakeoverService.getActiveSession(conversationId);

      res.json({
        success: true,
        message: 'Estado verificado exitosamente',
        data: {
          isUnderHumanControl: isUnderControl,
          session: session
        }
      });
    } catch (error: any) {
      logger.error('Check human control error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al verificar estado'
      });
    }
  }

  /**
   * Limpiar sesiones inactivas (solo administradores)
   */
  static async cleanupSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { hoursInactive = 24 } = req.body;

      const cleanedCount = HumanTakeoverService.cleanupInactiveSessions(hoursInactive);

      res.json({
        success: true,
        message: 'Limpieza completada exitosamente',
        data: { cleanedSessions: cleanedCount }
      });
    } catch (error: any) {
      logger.error('Cleanup sessions error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en la limpieza'
      });
    }
  }
}