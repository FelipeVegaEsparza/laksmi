import db from '../config/database';
import { Conversation, ConversationContext, ConversationChannel, ConversationStatus, Message } from '../types/ai';
import logger from '../utils/logger';
import { RealTimeNotificationService } from '../services/RealTimeNotificationService';

export class ConversationModel {
  static async findById(id: string): Promise<Conversation | null> {
    const conversation = await db('conversations').where({ id }).first();
    if (!conversation) return null;

    return this.formatConversation(conversation);
  }

  static async findByClientAndChannel(clientId: string, channel: ConversationChannel): Promise<Conversation | null> {
    const conversation = await db('conversations')
      .where({ client_id: clientId, channel })
      .whereIn('status', ['active', 'escalated'])
      .orderBy('last_activity', 'desc')
      .first();

    if (!conversation) return null;

    return this.formatConversation(conversation);
  }

  static async create(clientId: string, channel: ConversationChannel, initialContext?: Partial<ConversationContext>): Promise<Conversation> {
    const defaultContext: ConversationContext = {
      lastMessages: [],
      variables: {},
      ...initialContext
    };

    const insertData = {
      client_id: clientId,
      channel,
      status: 'active',
      context: JSON.stringify(defaultContext),
      last_activity: new Date()
    };

    await db('conversations').insert(insertData);

    // Buscar la conversación recién creada
    const conversation = await db('conversations')
      .where({ client_id: clientId, channel })
      .orderBy('created_at', 'desc')
      .first();

    if (!conversation) {
      throw new Error('Error creating conversation');
    }

    return this.formatConversation(conversation);
  }

  static async updateContext(id: string, context: ConversationContext): Promise<Conversation | null> {
    // Asegurarse de que context es un objeto antes de stringify
    const contextToSave = typeof context === 'string' ? context : JSON.stringify(context);

    const updateData = {
      context: contextToSave,
      last_activity: new Date(),
      updated_at: new Date()
    };

    const result = await db('conversations').where({ id }).update(updateData);

    if (result === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async updateStatus(id: string, status: ConversationStatus): Promise<Conversation | null> {
    const updateData = {
      status,
      last_activity: new Date(),
      updated_at: new Date()
    };

    const result = await db('conversations').where({ id }).update(updateData);

    if (result === 0) {
      return null;
    }

    const updatedConversation = await this.findById(id);
    
    // Emitir evento de actualización de estado en tiempo real
    if (updatedConversation) {
      try {
        // Obtener nombre del cliente
        const client = await db('clients').where({ id: updatedConversation.clientId }).first();
        const clientName = client?.name || 'Cliente';
        
        await RealTimeNotificationService.sendConversationStateUpdate(
          id,
          status,
          updatedConversation.humanTakeoverActive || false,
          updatedConversation.humanTakeoverAgentId || undefined,
          clientName
        );
      } catch (error) {
        logger.error(`Error emitting conversation state update for ${id}:`, error);
        // No lanzar error - la actualización debe completarse aunque falle la notificación
      }
    }
    
    return updatedConversation;
  }

  static async addMessage(conversationId: string, message: Omit<Message, 'id' | 'conversationId' | 'timestamp'>): Promise<Message> {
    // Asegurarse de que metadata es un objeto antes de stringify
    let metadataToSave = null;
    if (message.metadata) {
      metadataToSave = typeof message.metadata === 'string' ? message.metadata : JSON.stringify(message.metadata);
    }

    const messageData = {
      conversation_id: conversationId,
      sender_type: message.senderType,
      content: message.content,
      media_url: message.mediaUrl || null,
      metadata: metadataToSave
    };

    await db('messages').insert(messageData);

    // Buscar el mensaje recién creado
    const savedMessage = await db('messages')
      .where({ conversation_id: conversationId })
      .orderBy('timestamp', 'desc')
      .first();

    if (!savedMessage) {
      throw new Error('Error saving message');
    }

    // Actualizar la actividad de la conversación
    await db('conversations')
      .where({ id: conversationId })
      .update({ last_activity: new Date() });

    return this.formatMessage(savedMessage);
  }

  static async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const messages = await db('messages')
      .where({ conversation_id: conversationId })
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    return messages.map(message => this.formatMessage(message)).reverse();
  }

  static async getClientMessages(clientId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const messages = await db('messages')
      .join('conversations', 'messages.conversation_id', 'conversations.id')
      .where('conversations.client_id', clientId)
      .select('messages.*')
      .orderBy('messages.timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    return messages.map(message => this.formatMessage(message)).reverse();
  }

  static async getActiveConversations(limit: number = 100): Promise<Conversation[]> {
    const conversations = await db('conversations')
      .where({ status: 'active' })
      .orderBy('last_activity', 'desc')
      .limit(limit);

    return conversations.map(conversation => this.formatConversation(conversation));
  }

  static async getConversationsByClient(clientId: string, limit: number = 10): Promise<Conversation[]> {
    const conversations = await db('conversations')
      .where({ client_id: clientId })
      .orderBy('last_activity', 'desc')
      .limit(limit);

    return conversations.map(conversation => this.formatConversation(conversation));
  }

  static async closeConversation(id: string, reason?: string): Promise<Conversation | null> {
    const conversation = await this.findById(id);
    if (!conversation) return null;

    if (reason) {
      const updatedContext: ConversationContext = {
        ...conversation.context,
        closureReason: reason
      };
      await this.updateContext(id, updatedContext);
    }

    return this.updateStatus(id, 'closed');
  }

  static async deleteConversation(id: string): Promise<boolean> {
    // Primero eliminar mensajes asociados
    await db('messages').where({ conversation_id: id }).delete();

    // Luego eliminar la conversación
    const result = await db('conversations').where({ id }).delete();

    return result > 0;
  }

  static async deleteClientConversations(clientId: string): Promise<boolean> {
    // 1. Obtener todos los IDs de conversación del cliente
    const conversations = await db('conversations').where({ client_id: clientId }).select('id');
    const conversationIds = conversations.map(c => c.id);

    if (conversationIds.length === 0) return false;

    // 2. Eliminar mensajes de todas esas conversaciones
    await db('messages').whereIn('conversation_id', conversationIds).delete();

    // 3. Eliminar las conversaciones
    const result = await db('conversations').whereIn('id', conversationIds).delete();

    return result > 0;
  }

  static async escalateConversation(id: string, reason: string, humanAgentId?: string): Promise<Conversation | null> {
    const conversation = await this.findById(id);
    if (!conversation) return null;

    const updatedContext: ConversationContext = {
      ...conversation.context,
      escalationReason: reason,
      humanAgentId
    };

    await this.updateContext(id, updatedContext);
    const updatedConversation = await this.updateStatus(id, 'escalated');
    
    // Emitir evento de actualización de estado en tiempo real
    if (updatedConversation) {
      try {
        // Obtener nombre del cliente
        const client = await db('clients').where({ id: updatedConversation.clientId }).first();
        const clientName = client?.name || 'Cliente';
        
        await RealTimeNotificationService.sendConversationStateUpdate(
          id,
          'escalated',
          updatedConversation.humanTakeoverActive || false,
          humanAgentId,
          clientName
        );
      } catch (error) {
        logger.error(`Error emitting conversation state update for ${id}:`, error);
        // No lanzar error - la escalación debe completarse aunque falle la notificación
      }
    }
    
    return updatedConversation;
  }

  /**
   * Set or clear human takeover state for a conversation
   * @param conversationId - The conversation ID
   * @param agentId - The human agent ID taking control
   * @param active - Whether to activate (true) or deactivate (false) takeover
   */
  static async setHumanTakeover(
    conversationId: string,
    agentId: string,
    active: boolean
  ): Promise<void> {
    await db('conversations')
      .where({ id: conversationId })
      .update({
        human_takeover_active: active,
        human_takeover_agent_id: active ? agentId : null,
        last_human_message_time: active ? new Date() : null,
        updated_at: new Date()
      });
    
    // Emitir evento de actualización de estado en tiempo real
    try {
      const conversation = await this.findById(conversationId);
      if (conversation) {
        // Obtener nombre del cliente
        const client = await db('clients').where({ id: conversation.clientId }).first();
        const clientName = client?.name || 'Cliente';
        
        await RealTimeNotificationService.sendConversationStateUpdate(
          conversationId,
          active ? 'escalated' : 'active',
          active,
          active ? agentId : undefined,
          clientName
        );
      }
    } catch (error) {
      logger.error(`Error emitting conversation state update for ${conversationId}:`, error);
      // No lanzar error - el cambio de estado debe completarse aunque falle la notificación
    }
  }

  /**
   * Update the last human message timestamp for a conversation
   * This is called whenever a human agent sends a message during an active takeover session
   * to maintain the 1-hour timeout functionality
   * @param conversationId - The conversation ID
   */
  static async updateLastHumanMessageTime(
    conversationId: string
  ): Promise<void> {
    await db('conversations')
      .where({ id: conversationId })
      .update({
        last_human_message_time: new Date(),
        updated_at: new Date()
      });
  }

  /**
   * Get the current human takeover state for a conversation
   * @param conversationId - The conversation ID
   * @returns The takeover state (active, agentId, lastMessageTime) or null if conversation not found
   */
  static async getHumanTakeoverState(
    conversationId: string
  ): Promise<{
    active: boolean;
    agentId: string | null;
    lastMessageTime: Date | null;
  } | null> {
    const conversation = await db('conversations')
      .where({ id: conversationId })
      .select(
        'human_takeover_active',
        'human_takeover_agent_id',
        'last_human_message_time'
      )
      .first();

    if (!conversation) return null;

    return {
      active: conversation.human_takeover_active,
      agentId: conversation.human_takeover_agent_id,
      lastMessageTime: conversation.last_human_message_time
    };
  }

  /**
   * Clear expired human takeover sessions (older than 1 hour)
   * This method finds all conversations with active takeover where the last human message
   * was sent more than 1 hour ago, and deactivates them automatically
   * @returns The number of takeover sessions that were cleared
   */
  static async clearExpiredTakeovers(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await db('conversations')
      .where('human_takeover_active', true)
      .where('last_human_message_time', '<', oneHourAgo)
      .update({
        human_takeover_active: false,
        human_takeover_agent_id: null,
        updated_at: new Date()
      });

    return result;
  }

  /**
   * Find all conversations with active human takeover
   * @returns Array of conversations with active takeover sessions
   */
  static async findAllWithActiveTakeover(): Promise<Conversation[]> {
    const conversations = await db('conversations')
      .where('human_takeover_active', true)
      .orderBy('last_human_message_time', 'desc');

    return conversations.map(conversation => this.formatConversation(conversation));
  }

  /**
   * Find all conversations with active takeover by a specific human agent
   * @param humanAgentId - The human agent ID
   * @returns Array of conversations controlled by the specified agent
   */
  static async findByHumanAgent(humanAgentId: string): Promise<Conversation[]> {
    const conversations = await db('conversations')
      .where('human_takeover_active', true)
      .where('human_takeover_agent_id', humanAgentId)
      .orderBy('last_human_message_time', 'desc');

    return conversations.map(conversation => this.formatConversation(conversation));
  }

  static async cleanupInactiveConversations(hoursInactive: number = 24): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursInactive);

    const result = await db('conversations')
      .where('status', 'active')
      .where('last_activity', '<', cutoffTime)
      .update({
        status: 'closed',
        updated_at: new Date()
      });

    return result;
  }

  static async getConversationStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalConversations: number;
    activeConversations: number;
    closedConversations: number;
    escalatedConversations: number;
    averageMessageCount: number;
    channelStats: Record<ConversationChannel, number>;
  }> {
    let query = db('conversations');

    if (dateFrom) {
      query = query.where('created_at', '>=', dateFrom);
    }

    if (dateTo) {
      query = query.where('created_at', '<=', dateTo);
    }

    // Total de conversaciones
    const [totalResult] = await query.clone().count('* as count');
    const totalConversations = parseInt(totalResult.count as string);

    // Estadísticas por estado
    const statusStats = await query.clone()
      .select('status')
      .count('* as count')
      .groupBy('status');

    const statusMap = statusStats.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = parseInt(row.count as string);
      return acc;
    }, {} as Record<string, number>);

    // Estadísticas por canal
    const channelStats = await query.clone()
      .select('channel')
      .count('* as count')
      .groupBy('channel');

    const channelMap = channelStats.reduce((acc: Record<ConversationChannel, number>, row: any) => {
      acc[row.channel as ConversationChannel] = parseInt(row.count as string);
      return acc;
    }, {} as Record<ConversationChannel, number>);

    // Promedio de mensajes por conversación
    const [avgResult] = await db('conversations')
      .join('messages', 'conversations.id', 'messages.conversation_id')
      .avg('messages.id as avg_messages');

    const averageMessageCount = parseFloat(avgResult.avg_messages as string) || 0;

    return {
      totalConversations,
      activeConversations: parseInt(String(statusMap.active || 0)),
      closedConversations: parseInt(String(statusMap.closed || 0)),
      escalatedConversations: parseInt(String(statusMap.escalated || 0)),
      averageMessageCount,
      channelStats: {
        web: parseInt(String(channelMap.web || 0)),
        whatsapp: parseInt(String(channelMap.whatsapp || 0))
      }
    };
  }

  static getConversationsQuery() {
    return db('conversations')
      .leftJoin('clients', 'conversations.client_id', 'clients.id')
      .select(
        'conversations.*',
        'clients.name as client_name',
        'clients.phone as client_phone',
        'clients.email as client_email'
      );
  }

  static async getMonitorMetrics(dateFrom?: Date, dateTo?: Date, channel?: string): Promise<{
    averageResponseTime: number;
    escalationRate: number;
    resolutionRate: number;
    activeSessionsCount: number;
    peakHours: Array<{ hour: number; count: number }>;
  }> {
    let query = db('conversations');

    if (dateFrom) {
      query = query.where('created_at', '>=', dateFrom);
    }

    if (dateTo) {
      query = query.where('created_at', '<=', dateTo);
    }

    if (channel) {
      query = query.where('channel', channel);
    }

    // Calcular métricas
    const [totalConversations] = await query.clone().count('* as count');
    const total = parseInt(totalConversations.count as string);

    const [escalatedConversations] = await query.clone()
      .where('status', 'escalated')
      .count('* as count');
    const escalated = parseInt(escalatedConversations.count as string);

    const [closedConversations] = await query.clone()
      .where('status', 'closed')
      .count('* as count');
    const closed = parseInt(closedConversations.count as string);

    const [activeSessions] = await db('conversations')
      .where('status', 'active')
      .count('* as count');
    const activeSessionsCount = parseInt(activeSessions.count as string);

    // Calcular horas pico
    const peakHoursData = await db('conversations')
      .select(db.raw('HOUR(created_at) as hour'))
      .count('* as count')
      .groupBy(db.raw('HOUR(created_at)'))
      .orderBy('count', 'desc')
      .limit(5);

    const peakHours = peakHoursData.map((row: any) => ({
      hour: parseInt(row.hour as string),
      count: parseInt(row.count as string)
    }));

    return {
      averageResponseTime: 2.5, // Placeholder - calcular desde mensajes
      escalationRate: total > 0 ? (escalated / total) * 100 : 0,
      resolutionRate: total > 0 ? (closed / total) * 100 : 0,
      activeSessionsCount,
      peakHours
    };
  }

  static async getActiveConversationsWithDetails(limit: number = 20): Promise<any[]> {
    const conversations = await db('conversations')
      .leftJoin('clients', 'conversations.client_id', 'clients.id')
      .select(
        'conversations.*',
        'clients.name as client_name',
        'clients.phone as client_phone',
        'clients.email as client_email'
      )
      .where('conversations.status', 'active')
      .orderBy('conversations.last_activity', 'desc')
      .limit(limit);

    return conversations.map(conv => ({
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
  }

  static async getChannelAnalytics(dateFrom?: Date, dateTo?: Date): Promise<{
    web: { conversations: number; messages: number; avgDuration: number };
    whatsapp: { conversations: number; messages: number; avgDuration: number };
  }> {
    let query = db('conversations');

    if (dateFrom) {
      query = query.where('created_at', '>=', dateFrom);
    }

    if (dateTo) {
      query = query.where('created_at', '<=', dateTo);
    }

    const channelStats = await query
      .select('channel')
      .count('* as conversations')
      .groupBy('channel');

    const webStats = channelStats.find(s => s.channel === 'web') || { conversations: 0 };
    const whatsappStats = channelStats.find(s => s.channel === 'whatsapp') || { conversations: 0 };

    // Obtener conteo de mensajes por canal
    const messageStats = await db('messages')
      .join('conversations', 'messages.conversation_id', 'conversations.id')
      .select('conversations.channel')
      .count('messages.id as messages')
      .groupBy('conversations.channel');

    const webMessages = messageStats.find(s => s.channel === 'web')?.messages || 0;
    const whatsappMessages = messageStats.find(s => s.channel === 'whatsapp')?.messages || 0;

    return {
      web: {
        conversations: parseInt(webStats.conversations as string),
        messages: parseInt(webMessages as string),
        avgDuration: 15.5 // Placeholder
      },
      whatsapp: {
        conversations: parseInt(whatsappStats.conversations as string),
        messages: parseInt(whatsappMessages as string),
        avgDuration: 12.3 // Placeholder
      }
    };
  }

  static async getResponseTimeStats(dateFrom?: Date, dateTo?: Date, channel?: string): Promise<{
    averageResponseTime: number;
    medianResponseTime: number;
    percentile95: number;
    byHour: Array<{ hour: number; avgTime: number }>;
  }> {
    // Placeholder implementation - necesitaría análisis más complejo de timestamps de mensajes
    return {
      averageResponseTime: 2.5,
      medianResponseTime: 1.8,
      percentile95: 8.2,
      byHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        avgTime: Math.random() * 5 + 1
      }))
    };
  }

  static async exportToCSV(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    channel?: string;
  }): Promise<string> {
    let query = this.getConversationsQuery();

    if (filters.dateFrom) {
      query = query.where('conversations.created_at', '>=', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.where('conversations.created_at', '<=', filters.dateTo);
    }

    if (filters.status) {
      query = query.where('conversations.status', filters.status);
    }

    if (filters.channel) {
      query = query.where('conversations.channel', filters.channel);
    }

    const conversations = await query.orderBy('conversations.created_at', 'desc');

    // Generar CSV
    const headers = ['ID', 'Cliente', 'Teléfono', 'Canal', 'Estado', 'Creada', 'Última Actividad'];
    const csvRows = [headers.join(',')];

    conversations.forEach(conv => {
      const row = [
        conv.id,
        `"${conv.client_name || 'N/A'}"`,
        conv.client_phone || 'N/A',
        conv.channel,
        conv.status,
        new Date(conv.created_at).toISOString(),
        new Date(conv.last_activity).toISOString()
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private static formatConversation(dbConversation: any): Conversation {
    // Parsear context solo si es string
    let context = { lastMessages: [], variables: {} };
    if (dbConversation.context) {
      if (typeof dbConversation.context === 'string') {
        try {
          context = JSON.parse(dbConversation.context);
        } catch (error) {
          logger.error('Error parsing conversation context:', error);
        }
      } else {
        context = dbConversation.context;
      }
    }

    return {
      id: dbConversation.id,
      clientId: dbConversation.client_id,
      channel: dbConversation.channel,
      status: dbConversation.status,
      context,
      lastActivity: new Date(dbConversation.last_activity),
      createdAt: dbConversation.created_at,
      updatedAt: dbConversation.updated_at,
      humanTakeoverActive: dbConversation.human_takeover_active || false,
      humanTakeoverAgentId: dbConversation.human_takeover_agent_id || null,
      lastHumanMessageTime: dbConversation.last_human_message_time ? new Date(dbConversation.last_human_message_time) : null
    };
  }

  private static formatMessage(dbMessage: any): Message {
    // Parsear metadata solo si es string
    let metadata = undefined;
    if (dbMessage.metadata) {
      if (typeof dbMessage.metadata === 'string') {
        try {
          metadata = JSON.parse(dbMessage.metadata);
        } catch (error) {
          logger.error('Error parsing message metadata:', error);
          metadata = undefined;
        }
      } else {
        metadata = dbMessage.metadata;
      }
    }

    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversation_id,
      senderType: dbMessage.sender_type,
      content: dbMessage.content,
      mediaUrl: dbMessage.media_url,
      metadata,
      timestamp: new Date(dbMessage.timestamp)
    };
  }
}