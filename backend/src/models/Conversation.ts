import db from '../config/database';
import { Conversation, ConversationContext, ConversationChannel, ConversationStatus, Message } from '../types/ai';

export class ConversationModel {
  static async findById(id: string): Promise<Conversation | null> {
    const conversation = await db('conversations').where({ id }).first();
    if (!conversation) return null;
    
    return this.formatConversation(conversation);
  }

  static async findByClientAndChannel(clientId: string, channel: ConversationChannel): Promise<Conversation | null> {
    const conversation = await db('conversations')
      .where({ client_id: clientId, channel, status: 'active' })
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

    return this.findById(id);
  }

  static async addMessage(conversationId: string, message: Omit<Message, 'id' | 'conversationId' | 'timestamp'>): Promise<Message> {
    const messageData = {
      conversation_id: conversationId,
      sender_type: message.senderType,
      content: message.content,
      media_url: message.mediaUrl || null,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null
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

  static async escalateConversation(id: string, reason: string, humanAgentId?: string): Promise<Conversation | null> {
    const conversation = await this.findById(id);
    if (!conversation) return null;

    const updatedContext: ConversationContext = {
      ...conversation.context,
      escalationReason: reason,
      humanAgentId
    };

    await this.updateContext(id, updatedContext);
    return this.updateStatus(id, 'escalated');
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
    return {
      id: dbConversation.id,
      clientId: dbConversation.client_id,
      channel: dbConversation.channel,
      status: dbConversation.status,
      context: dbConversation.context ? JSON.parse(dbConversation.context) : { lastMessages: [], variables: {} },
      lastActivity: new Date(dbConversation.last_activity),
      createdAt: dbConversation.created_at,
      updatedAt: dbConversation.updated_at
    };
  }

  private static formatMessage(dbMessage: any): Message {
    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversation_id,
      senderType: dbMessage.sender_type,
      content: dbMessage.content,
      mediaUrl: dbMessage.media_url,
      metadata: dbMessage.metadata ? JSON.parse(dbMessage.metadata) : undefined,
      timestamp: new Date(dbMessage.timestamp)
    };
  }
}