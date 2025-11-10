import { Request, Response } from 'express';
import { ConversationModel } from '../models/Conversation';
import { ClientModel } from '../models/Client';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class ConversationController {
  /**
   * Obtener conversaciones con filtros y paginación
   */
  static async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        channel,
        clientId,
        dateFrom,
        dateTo
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Construir query base
      let query = ConversationModel.getConversationsQuery();

      // Aplicar filtros
      if (status) {
        query = query.where('conversations.status', status);
      }

      if (channel) {
        query = query.where('conversations.channel', channel);
      }

      if (clientId) {
        query = query.where('conversations.client_id', clientId);
      }

      if (dateFrom) {
        query = query.where('conversations.created_at', '>=', new Date(dateFrom as string));
      }

      if (dateTo) {
        query = query.where('conversations.created_at', '<=', new Date(dateTo as string));
      }

      // Búsqueda por nombre de cliente
      if (search) {
        query = query.where(function() {
          this.where('clients.name', 'like', `%${search}%`)
              .orWhere('clients.phone', 'like', `%${search}%`)
              .orWhere('clients.email', 'like', `%${search}%`);
        });
      }

      // Obtener total para paginación
      const totalQuery = query.clone();
      const [{ count: total }] = await totalQuery.count('conversations.id as count');

      // Obtener datos paginados
      const conversations = await query
        .orderBy('conversations.last_activity', 'desc')
        .limit(limitNum)
        .offset(offset);

      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        clientId: conv.client_id,
        channel: conv.channel,
        status: conv.status,
        context: conv.context ? JSON.parse(conv.context) : { lastMessages: [], variables: {} },
        lastActivity: conv.last_activity,
        createdAt: conv.created_at,
        client: {
          id: conv.client_id,
          name: conv.client_name,
          phone: conv.client_phone,
          email: conv.client_email
        }
      }));

      res.json({
        success: true,
        message: 'Conversaciones obtenidas exitosamente',
        data: formattedConversations,
        total: parseInt(total as string),
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(parseInt(total as string) / limitNum)
      });
    } catch (error: any) {
      logger.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener conversaciones'
      });
    }
  }

  /**
   * Obtener conversación específica con mensajes
   */
  static async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeMessages = 'true', messageLimit = '50' } = req.query;

      const conversation = await ConversationModel.findById(id);
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
        return;
      }

      // Obtener información del cliente
      const client = await ClientModel.findById(conversation.clientId);

      let messages: any[] = [];
      if (includeMessages === 'true') {
        messages = await ConversationModel.getMessages(id, parseInt(messageLimit as string));
      }

      res.json({
        success: true,
        message: 'Conversación obtenida exitosamente',
        data: {
          ...conversation,
          client,
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

  /**
   * Obtener mensajes de una conversación
   */
  static async getConversationMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = '50', offset = '0' } = req.query;

      const conversation = await ConversationModel.findById(id);
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
        return;
      }

      const messages = await ConversationModel.getMessages(
        id, 
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        success: true,
        message: 'Mensajes obtenidos exitosamente',
        data: messages
      });
    } catch (error: any) {
      logger.error('Get conversation messages error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener mensajes'
      });
    }
  }

  /**
   * Obtener métricas del monitor de conversaciones
   */
  static async getConversationMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, channel } = req.query;

      const dateFromObj = dateFrom ? new Date(dateFrom as string) : undefined;
      const dateToObj = dateTo ? new Date(dateTo as string) : undefined;

      // Obtener estadísticas básicas
      const stats = await ConversationModel.getConversationStats(dateFromObj, dateToObj);

      // Métricas adicionales para el monitor
      const additionalMetrics = await ConversationModel.getMonitorMetrics(
        dateFromObj, 
        dateToObj, 
        channel as string
      );

      const metrics = {
        ...stats,
        ...additionalMetrics,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Métricas obtenidas exitosamente',
        data: metrics
      });
    } catch (error: any) {
      logger.error('Get conversation metrics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener métricas'
      });
    }
  }

  /**
   * Obtener conversaciones activas en tiempo real
   */
  static async getActiveConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { limit = '20' } = req.query;

      const conversations = await ConversationModel.getActiveConversationsWithDetails(
        parseInt(limit as string)
      );

      res.json({
        success: true,
        message: 'Conversaciones activas obtenidas exitosamente',
        data: conversations
      });
    } catch (error: any) {
      logger.error('Get active conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener conversaciones activas'
      });
    }
  }

  /**
   * Obtener análisis de rendimiento por canal
   */
  static async getChannelAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo } = req.query;

      const dateFromObj = dateFrom ? new Date(dateFrom as string) : undefined;
      const dateToObj = dateTo ? new Date(dateTo as string) : undefined;

      const analytics = await ConversationModel.getChannelAnalytics(dateFromObj, dateToObj);

      res.json({
        success: true,
        message: 'Analytics por canal obtenidos exitosamente',
        data: analytics
      });
    } catch (error: any) {
      logger.error('Get channel analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener analytics por canal'
      });
    }
  }

  /**
   * Obtener estadísticas de tiempo de respuesta
   */
  static async getResponseTimeStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, channel } = req.query;

      const dateFromObj = dateFrom ? new Date(dateFrom as string) : undefined;
      const dateToObj = dateTo ? new Date(dateTo as string) : undefined;

      const stats = await ConversationModel.getResponseTimeStats(
        dateFromObj, 
        dateToObj, 
        channel as string
      );

      res.json({
        success: true,
        message: 'Estadísticas de tiempo de respuesta obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get response time stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas de tiempo de respuesta'
      });
    }
  }

  /**
   * Cerrar conversación
   */
  static async closeConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const conversation = await ConversationModel.closeConversation(id, reason);
      
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

  /**
   * Reabrir conversación
   */
  static async reopenConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const conversation = await ConversationModel.updateStatus(id, 'active');
      
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversación no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Conversación reabierta exitosamente',
        data: conversation
      });
    } catch (error: any) {
      logger.error('Reopen conversation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al reabrir conversación'
      });
    }
  }

  /**
   * Exportar conversaciones a CSV
   */
  static async exportConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, status, channel } = req.query;

      const csvData = await ConversationModel.exportToCSV({
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        status: status as string,
        channel: channel as string
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=conversaciones.csv');
      res.send(csvData);
    } catch (error: any) {
      logger.error('Export conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al exportar conversaciones'
      });
    }
  }
}