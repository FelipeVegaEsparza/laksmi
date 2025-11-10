import { Request, Response } from 'express';
import { EscalationService } from '../services/ai/EscalationService';
import { ConversationModel } from '../models/Conversation';
import { EscalationReason, EscalationPriority } from '../types/ai';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class EscalationController {
  /**
   * Obtener escalaciones activas
   */
  static async getActiveEscalations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        priority: req.query.priority as EscalationPriority,
        reason: req.query.reason as EscalationReason,
        status: req.query.status as 'pending' | 'assigned' | 'resolved',
        humanAgentId: req.query.humanAgentId as string
      };

      // Limpiar filtros undefined
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const escalations = EscalationService.getActiveEscalations(filters);

      res.json({
        success: true,
        message: 'Escalaciones obtenidas exitosamente',
        data: escalations
      });
    } catch (error: any) {
      logger.error('Get active escalations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener escalaciones'
      });
    }
  }

  /**
   * Escalar conversación manualmente
   */
  static async escalateConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { reason, priority, summary, humanAgentId } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'La razón de escalación es requerida'
        });
        return;
      }

      const result = await EscalationService.escalateToHuman(
        conversationId,
        reason,
        priority || 'medium',
        summary,
        humanAgentId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: { escalationId: result.escalationId }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error: any) {
      logger.error('Escalate conversation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al escalar conversación'
      });
    }
  }

  /**
   * Asignar agente humano a escalación
   */
  static async assignHumanAgent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      const { humanAgentId } = req.body;

      if (!humanAgentId) {
        res.status(400).json({
          success: false,
          error: 'El ID del agente humano es requerido'
        });
        return;
      }

      const result = await EscalationService.assignHumanAgent(escalationId, humanAgentId);

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
      logger.error('Assign human agent error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al asignar agente humano'
      });
    }
  }

  /**
   * Tomar control de una escalación
   */
  static async takeControl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      const humanAgentId = req.user?.userId; // Usar userId del token JWT

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const result = await EscalationService.assignHumanAgent(escalationId, humanAgentId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Control tomado exitosamente'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error: any) {
      logger.error('Take control error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al tomar control'
      });
    }
  }

  /**
   * Resolver escalación
   */
  static async resolveEscalation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      const { resolution } = req.body;
      const humanAgentId = req.user?.userId;

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      if (!resolution) {
        res.status(400).json({
          success: false,
          error: 'La descripción de la resolución es requerida'
        });
        return;
      }

      const result = await EscalationService.resolveEscalation(
        escalationId,
        resolution,
        humanAgentId
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
      logger.error('Resolve escalation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al resolver escalación'
      });
    }
  }

  /**
   * Obtener detalles de escalación específica
   */
  static async getEscalationDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { escalationId } = req.params;
      
      const escalations = EscalationService.getActiveEscalations();
      const escalation = escalations.find(e => e.escalationId === escalationId);

      if (!escalation) {
        res.status(404).json({
          success: false,
          error: 'Escalación no encontrada'
        });
        return;
      }

      // Obtener detalles adicionales de la conversación
      const conversation = await ConversationModel.findById(escalation.conversationId);
      const messages = conversation ? await ConversationModel.getMessages(escalation.conversationId, 20) : [];

      res.json({
        success: true,
        message: 'Detalles de escalación obtenidos exitosamente',
        data: {
          escalation,
          conversation,
          recentMessages: messages
        }
      });
    } catch (error: any) {
      logger.error('Get escalation details error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener detalles de escalación'
      });
    }
  }

  /**
   * Obtener estadísticas de escalaciones
   */
  static async getEscalationStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = EscalationService.getEscalationStats();

      res.json({
        success: true,
        message: 'Estadísticas de escalación obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get escalation stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Obtener escalaciones asignadas a un agente
   */
  static async getMyEscalations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const humanAgentId = req.user?.userId;

      if (!humanAgentId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const escalations = EscalationService.getActiveEscalations({
        humanAgentId,
        status: 'assigned'
      });

      res.json({
        success: true,
        message: 'Escalaciones asignadas obtenidas exitosamente',
        data: escalations
      });
    } catch (error: any) {
      logger.error('Get my escalations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener escalaciones asignadas'
      });
    }
  }

  /**
   * Limpiar escalaciones antiguas
   */
  static async cleanupOldEscalations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { hoursOld = 48 } = req.body;
      
      const cleanedCount = EscalationService.cleanupOldEscalations(hoursOld);

      res.json({
        success: true,
        message: 'Limpieza completada exitosamente',
        data: { cleanedEscalations: cleanedCount }
      });
    } catch (error: any) {
      logger.error('Cleanup escalations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en la limpieza'
      });
    }
  }

  /**
   * Actualizar configuración de escalación
   */
  static async updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = req.body;
      
      EscalationService.updateConfig(config);

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente'
      });
    } catch (error: any) {
      logger.error('Update escalation config error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar configuración'
      });
    }
  }

  /**
   * Obtener configuración actual
   */
  static async getConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = EscalationService.getConfig();

      res.json({
        success: true,
        message: 'Configuración obtenida exitosamente',
        data: config
      });
    } catch (error: any) {
      logger.error('Get escalation config error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener configuración'
      });
    }
  }

  /**
   * Obtener estado completo del sistema de escalación
   */
  static async getSystemStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const escalationStats = EscalationService.getEscalationStats();
      const escalationConfig = EscalationService.getConfig();
      
      // Importar dinámicamente para evitar dependencias circulares
      const { HumanTakeoverService } = await import('../services/ai/HumanTakeoverService');
      const { AlertService } = await import('../services/AlertService');
      
      const takeoverStats = HumanTakeoverService.getSessionStats();
      const alertStats = AlertService.getStats();

      const systemStatus = {
        escalations: {
          stats: escalationStats,
          config: escalationConfig
        },
        humanTakeover: {
          stats: takeoverStats
        },
        alerts: {
          stats: alertStats
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Estado del sistema obtenido exitosamente',
        data: systemStatus
      });
    } catch (error: any) {
      logger.error('Get system status error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estado del sistema'
      });
    }
  }
}