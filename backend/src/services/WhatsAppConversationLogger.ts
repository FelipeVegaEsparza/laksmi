import { ConversationModel } from '../models/Conversation';
import { ClientModel } from '../models/Client';
import { ProcessedWhatsAppMessage } from './WhatsAppMessageProcessor';
import logger from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export interface ConversationLogEntry {
  timestamp: Date;
  conversationId: string;
  clientId: string;
  phoneNumber: string;
  messageType: 'incoming' | 'outgoing';
  content: string;
  mediaInfo?: {
    type: string;
    filename: string;
    size: number;
  };
  aiResponse?: {
    intent: string;
    confidence: number;
    processingTime: number;
  };
  escalated?: boolean;
  humanAgentId?: string;
}

export interface ConversationAnalytics {
  totalConversations: number;
  activeConversations: number;
  averageMessagesPerConversation: number;
  topIntents: Array<{ intent: string; count: number }>;
  escalationRate: number;
  responseTimeStats: {
    average: number;
    median: number;
    p95: number;
  };
  mediaUsageStats: {
    totalMediaMessages: number;
    mediaTypes: Record<string, number>;
  };
  clientStats: {
    newClients: number;
    returningClients: number;
    topActiveClients: Array<{ clientId: string; messageCount: number }>;
  };
}

export class WhatsAppConversationLogger {
  private static readonly LOG_FILE_PATH = 'logs/whatsapp-conversations.jsonl';
  private static readonly ANALYTICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private static analyticsCache: { data: ConversationAnalytics; timestamp: number } | null = null;

  /**
   * Registrar entrada de conversación
   */
  static async logConversationEntry(entry: ConversationLogEntry): Promise<void> {
    try {
      // Log estructurado para análisis
      const logEntry = {
        ...entry,
        timestamp: entry.timestamp.toISOString()
      };

      // Escribir a archivo de log JSONL
      await this.writeToLogFile(logEntry);

      // Log para monitoreo en tiempo real
      logger.info('WhatsApp conversation entry logged', {
        conversationId: entry.conversationId,
        clientId: entry.clientId,
        messageType: entry.messageType,
        hasMedia: !!entry.mediaInfo,
        intent: entry.aiResponse?.intent,
        escalated: entry.escalated
      });

    } catch (error: any) {
      logger.error('Error logging conversation entry:', error);
    }
  }

  /**
   * Registrar mensaje entrante de WhatsApp
   */
  static async logIncomingMessage(
    message: ProcessedWhatsAppMessage,
    conversationId: string,
    aiResponse?: {
      intent: string;
      confidence: number;
      processingTime: number;
    }
  ): Promise<void> {
    const entry: ConversationLogEntry = {
      timestamp: message.timestamp,
      conversationId,
      clientId: message.clientId,
      phoneNumber: message.phoneNumber,
      messageType: 'incoming',
      content: message.message,
      mediaInfo: message.mediaInfo ? {
        type: message.mediaInfo.contentType,
        filename: message.mediaInfo.filename,
        size: message.mediaInfo.size || 0
      } : undefined,
      aiResponse
    };

    await this.logConversationEntry(entry);
  }

  /**
   * Registrar mensaje saliente de WhatsApp
   */
  static async logOutgoingMessage(
    conversationId: string,
    clientId: string,
    phoneNumber: string,
    content: string,
    humanAgentId?: string
  ): Promise<void> {
    const entry: ConversationLogEntry = {
      timestamp: new Date(),
      conversationId,
      clientId,
      phoneNumber,
      messageType: 'outgoing',
      content,
      humanAgentId
    };

    await this.logConversationEntry(entry);
  }

  /**
   * Registrar escalación de conversación
   */
  static async logEscalation(
    conversationId: string,
    clientId: string,
    phoneNumber: string,
    reason: string,
    humanAgentId?: string
  ): Promise<void> {
    const entry: ConversationLogEntry = {
      timestamp: new Date(),
      conversationId,
      clientId,
      phoneNumber,
      messageType: 'incoming',
      content: `[ESCALATION] ${reason}`,
      escalated: true,
      humanAgentId
    };

    await this.logConversationEntry(entry);
  }

  /**
   * Obtener analíticas de conversaciones
   */
  static async getConversationAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
    forceRefresh: boolean = false
  ): Promise<ConversationAnalytics> {
    try {
      // Verificar cache
      if (!forceRefresh && this.analyticsCache && 
          Date.now() - this.analyticsCache.timestamp < this.ANALYTICS_CACHE_TTL) {
        return this.analyticsCache.data;
      }

      // Generar analíticas frescas
      const analytics = await this.generateAnalytics(dateFrom, dateTo);
      
      // Actualizar cache
      this.analyticsCache = {
        data: analytics,
        timestamp: Date.now()
      };

      return analytics;

    } catch (error: any) {
      logger.error('Error generating conversation analytics:', error);
      throw error;
    }
  }

  /**
   * Obtener conversaciones por cliente
   */
  static async getClientConversationHistory(
    clientId: string,
    limit: number = 50
  ): Promise<ConversationLogEntry[]> {
    try {
      const entries = await this.readLogEntries();
      
      return entries
        .filter(entry => entry.clientId === clientId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error: any) {
      logger.error('Error getting client conversation history:', error);
      return [];
    }
  }

  /**
   * Buscar conversaciones por criterios
   */
  static async searchConversations(criteria: {
    phoneNumber?: string;
    intent?: string;
    escalated?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    hasMedia?: boolean;
  }): Promise<ConversationLogEntry[]> {
    try {
      const entries = await this.readLogEntries();
      
      return entries.filter(entry => {
        if (criteria.phoneNumber && entry.phoneNumber !== criteria.phoneNumber) {
          return false;
        }
        
        if (criteria.intent && entry.aiResponse?.intent !== criteria.intent) {
          return false;
        }
        
        if (criteria.escalated !== undefined && entry.escalated !== criteria.escalated) {
          return false;
        }
        
        if (criteria.hasMedia !== undefined && !!entry.mediaInfo !== criteria.hasMedia) {
          return false;
        }
        
        const entryDate = new Date(entry.timestamp);
        if (criteria.dateFrom && entryDate < criteria.dateFrom) {
          return false;
        }
        
        if (criteria.dateTo && entryDate > criteria.dateTo) {
          return false;
        }
        
        return true;
      });

    } catch (error: any) {
      logger.error('Error searching conversations:', error);
      return [];
    }
  }

  /**
   * Exportar conversaciones a CSV
   */
  static async exportConversationsToCSV(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<string> {
    try {
      const entries = await this.searchConversations({ dateFrom, dateTo });
      
      const csvHeader = 'Timestamp,ConversationId,ClientId,PhoneNumber,MessageType,Content,Intent,Confidence,Escalated,HumanAgent\n';
      
      const csvRows = entries.map(entry => {
        const content = entry.content.replace(/"/g, '""'); // Escape quotes
        return [
          entry.timestamp,
          entry.conversationId,
          entry.clientId,
          entry.phoneNumber,
          entry.messageType,
          `"${content}"`,
          entry.aiResponse?.intent || '',
          entry.aiResponse?.confidence || '',
          entry.escalated || false,
          entry.humanAgentId || ''
        ].join(',');
      }).join('\n');

      return csvHeader + csvRows;

    } catch (error: any) {
      logger.error('Error exporting conversations to CSV:', error);
      throw error;
    }
  }

  /**
   * Limpiar logs antiguos
   */
  static async cleanupOldLogs(daysOld: number = 90): Promise<{
    entriesDeleted: number;
    fileSizeReduced: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const entries = await this.readLogEntries();
      const originalCount = entries.length;
      
      const filteredEntries = entries.filter(entry => 
        new Date(entry.timestamp) >= cutoffDate
      );

      // Reescribir archivo con entradas filtradas
      await this.rewriteLogFile(filteredEntries);

      const entriesDeleted = originalCount - filteredEntries.length;
      
      logger.info('Conversation logs cleanup completed', {
        entriesDeleted,
        daysOld,
        remainingEntries: filteredEntries.length
      });

      return {
        entriesDeleted,
        fileSizeReduced: 0 // Simplificado por ahora
      };

    } catch (error: any) {
      logger.error('Error cleaning up old logs:', error);
      return { entriesDeleted: 0, fileSizeReduced: 0 };
    }
  }

  // Métodos privados

  private static async writeToLogFile(entry: any): Promise<void> {
    try {
      // Asegurar que el directorio existe
      const logDir = path.dirname(this.LOG_FILE_PATH);
      await fs.mkdir(logDir, { recursive: true });

      // Escribir entrada como línea JSONL
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.LOG_FILE_PATH, logLine, 'utf8');

    } catch (error: any) {
      logger.error('Error writing to log file:', error);
    }
  }

  private static async readLogEntries(): Promise<ConversationLogEntry[]> {
    try {
      const content = await fs.readFile(this.LOG_FILE_PATH, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          const entry = JSON.parse(line);
          return {
            ...entry,
            timestamp: new Date(entry.timestamp)
          };
        } catch {
          return null;
        }
      }).filter(entry => entry !== null) as ConversationLogEntry[];

    } catch (error: any) {
      // Archivo no existe o está vacío
      return [];
    }
  }

  private static async rewriteLogFile(entries: ConversationLogEntry[]): Promise<void> {
    try {
      const content = entries.map(entry => 
        JSON.stringify({
          ...entry,
          timestamp: entry.timestamp.toISOString()
        })
      ).join('\n') + '\n';

      await fs.writeFile(this.LOG_FILE_PATH, content, 'utf8');

    } catch (error: any) {
      logger.error('Error rewriting log file:', error);
    }
  }

  private static async generateAnalytics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ConversationAnalytics> {
    const entries = await this.searchConversations({ dateFrom, dateTo });
    
    // Agrupar por conversación
    const conversationMap = new Map<string, ConversationLogEntry[]>();
    entries.forEach(entry => {
      if (!conversationMap.has(entry.conversationId)) {
        conversationMap.set(entry.conversationId, []);
      }
      conversationMap.get(entry.conversationId)!.push(entry);
    });

    // Calcular métricas
    const totalConversations = conversationMap.size;
    const activeConversations = Array.from(conversationMap.values())
      .filter(msgs => msgs.some(msg => 
        new Date(msg.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      )).length;

    const totalMessages = entries.length;
    const averageMessagesPerConversation = totalConversations > 0 ? 
      totalMessages / totalConversations : 0;

    // Top intents
    const intentCounts = new Map<string, number>();
    entries.forEach(entry => {
      if (entry.aiResponse?.intent) {
        const count = intentCounts.get(entry.aiResponse.intent) || 0;
        intentCounts.set(entry.aiResponse.intent, count + 1);
      }
    });

    const topIntents = Array.from(intentCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count }));

    // Tasa de escalación
    const escalatedCount = entries.filter(entry => entry.escalated).length;
    const escalationRate = totalMessages > 0 ? escalatedCount / totalMessages : 0;

    // Estadísticas de tiempo de respuesta
    const responseTimes = entries
      .filter(entry => entry.aiResponse?.processingTime)
      .map(entry => entry.aiResponse!.processingTime);

    const responseTimeStats = {
      average: responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      median: this.calculateMedian(responseTimes),
      p95: this.calculatePercentile(responseTimes, 95)
    };

    // Estadísticas de media
    const mediaMessages = entries.filter(entry => entry.mediaInfo);
    const mediaTypes = new Map<string, number>();
    mediaMessages.forEach(entry => {
      if (entry.mediaInfo) {
        const count = mediaTypes.get(entry.mediaInfo.type) || 0;
        mediaTypes.set(entry.mediaInfo.type, count + 1);
      }
    });

    // Estadísticas de clientes
    const clientCounts = new Map<string, number>();
    entries.forEach(entry => {
      const count = clientCounts.get(entry.clientId) || 0;
      clientCounts.set(entry.clientId, count + 1);
    });

    const topActiveClients = Array.from(clientCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([clientId, messageCount]) => ({ clientId, messageCount }));

    return {
      totalConversations,
      activeConversations,
      averageMessagesPerConversation,
      topIntents,
      escalationRate,
      responseTimeStats,
      mediaUsageStats: {
        totalMediaMessages: mediaMessages.length,
        mediaTypes: Object.fromEntries(mediaTypes)
      },
      clientStats: {
        newClients: 0, // Simplificado por ahora
        returningClients: 0, // Simplificado por ahora
        topActiveClients
      }
    };
  }

  private static calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  private static calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)];
  }
}