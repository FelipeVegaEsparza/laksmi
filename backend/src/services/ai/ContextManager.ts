import { ConversationModel } from '../../models/Conversation';
import { ConversationContext, Message, ContextManagerConfig } from '../../types/ai';
import logger from '../../utils/logger';

export class ContextManager {
  private static config: ContextManagerConfig = {
    sessionTimeoutMinutes: 30,
    maxMessagesInContext: 10,
    persistContextToDatabase: true,
    contextCleanupIntervalMinutes: 60
  };

  // Cache en memoria para contextos activos
  private static contextCache = new Map<string, {
    context: ConversationContext;
    lastAccess: Date;
  }>();

  /**
   * Obtener contexto de conversación
   */
  static async getContext(conversationId: string): Promise<ConversationContext> {
    try {
      // Intentar obtener del cache primero
      const cached = this.contextCache.get(conversationId);
      if (cached && this.isContextValid(cached.lastAccess)) {
        cached.lastAccess = new Date();
        return { ...cached.context };
      }

      // Obtener de la base de datos
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      // Actualizar cache
      this.contextCache.set(conversationId, {
        context: conversation.context,
        lastAccess: new Date()
      });

      return { ...conversation.context };

    } catch (error) {
      logger.error(`Error getting context for conversation ${conversationId}:`, error);
      
      // Retornar contexto por defecto en caso de error
      return this.createDefaultContext();
    }
  }

  /**
   * Actualizar contexto de conversación
   */
  static async updateContext(conversationId: string, updates: Partial<ConversationContext>): Promise<ConversationContext> {
    try {
      const currentContext = await this.getContext(conversationId);
      const updatedContext: ConversationContext = {
        ...currentContext,
        ...updates
      };

      // Limitar número de mensajes en contexto
      if (updatedContext.lastMessages.length > this.config.maxMessagesInContext) {
        updatedContext.lastMessages = updatedContext.lastMessages.slice(-this.config.maxMessagesInContext);
      }

      // Actualizar cache
      this.contextCache.set(conversationId, {
        context: updatedContext,
        lastAccess: new Date()
      });

      // Persistir en base de datos si está habilitado
      if (this.config.persistContextToDatabase) {
        await ConversationModel.updateContext(conversationId, updatedContext);
      }

      return { ...updatedContext };

    } catch (error) {
      logger.error(`Error updating context for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Agregar mensaje al contexto
   */
  static async addMessageToContext(conversationId: string, message: Message): Promise<ConversationContext> {
    const currentContext = await this.getContext(conversationId);
    
    // Crear una copia del mensaje sin metadata complejo para evitar problemas de serialización
    const messageForContext = {
      ...message,
      metadata: message.metadata ? (typeof message.metadata === 'string' ? message.metadata : JSON.stringify(message.metadata)) : undefined
    };
    
    const updatedMessages = [...currentContext.lastMessages, messageForContext as Message];
    
    return await this.updateContext(conversationId, {
      lastMessages: updatedMessages
    });
  }

  /**
   * Establecer intención actual
   */
  static async setCurrentIntent(conversationId: string, intent: string): Promise<ConversationContext> {
    return await this.updateContext(conversationId, {
      currentIntent: intent
    });
  }

  /**
   * Establecer flujo actual
   */
  static async setCurrentFlow(conversationId: string, flow: string, step: number = 0): Promise<ConversationContext> {
    return await this.updateContext(conversationId, {
      currentFlow: flow,
      flowStep: step
    });
  }

  /**
   * Avanzar paso en el flujo actual
   */
  static async advanceFlowStep(conversationId: string): Promise<ConversationContext> {
    const currentContext = await this.getContext(conversationId);
    const nextStep = (currentContext.flowStep || 0) + 1;
    
    return await this.updateContext(conversationId, {
      flowStep: nextStep
    });
  }

  /**
   * Establecer variable en el contexto
   */
  static async setVariable(conversationId: string, key: string, value: any): Promise<ConversationContext> {
    const currentContext = await this.getContext(conversationId);
    const updatedVariables = {
      ...currentContext.variables,
      [key]: value
    };
    
    return await this.updateContext(conversationId, {
      variables: updatedVariables
    });
  }

  /**
   * Obtener variable del contexto
   */
  static async getVariable(conversationId: string, key: string): Promise<any> {
    const context = await this.getContext(conversationId);
    return context.variables[key];
  }

  /**
   * Actualizar reserva pendiente
   */
  static async updatePendingBooking(conversationId: string, bookingData: Partial<any>): Promise<ConversationContext> {
    const currentContext = await this.getContext(conversationId);
    const updatedBooking = {
      step: 'service_selection' as const,
      ...currentContext.pendingBooking,
      ...bookingData
    };
    
    return await this.updateContext(conversationId, {
      pendingBooking: updatedBooking
    });
  }

  /**
   * Limpiar contexto (reiniciar conversación)
   */
  static async clearContext(conversationId: string): Promise<ConversationContext> {
    const defaultContext = this.createDefaultContext();
    
    // Mantener algunas preferencias del usuario si existen
    const currentContext = await this.getContext(conversationId);
    if (currentContext.userPreferences) {
      defaultContext.userPreferences = currentContext.userPreferences;
    }

    return await this.updateContext(conversationId, defaultContext);
  }

  /**
   * Obtener resumen del contexto para escalación
   */
  static async getContextSummary(conversationId: string): Promise<{
    intent: string | undefined;
    flow: string | undefined;
    step: number | undefined;
    pendingBooking: any;
    recentMessages: Message[];
    variables: Record<string, any>;
  }> {
    const context = await this.getContext(conversationId);
    
    return {
      intent: context.currentIntent,
      flow: context.currentFlow,
      step: context.flowStep,
      pendingBooking: context.pendingBooking,
      recentMessages: context.lastMessages.slice(-5), // Últimos 5 mensajes
      variables: context.variables
    };
  }

  /**
   * Verificar si el contexto ha expirado
   */
  static async isContextExpired(conversationId: string): Promise<boolean> {
    const cached = this.contextCache.get(conversationId);
    if (cached) {
      return !this.isContextValid(cached.lastAccess);
    }

    // Si no está en cache, verificar en base de datos
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return true;
    }

    const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
    const now = new Date();
    const timeDiff = now.getTime() - conversation.lastActivity.getTime();
    
    return timeDiff > timeoutMs;
  }

  /**
   * Limpiar contextos expirados del cache
   */
  static cleanupExpiredContexts(): number {
    let cleanedCount = 0;
    const now = new Date();
    
    for (const [conversationId, cached] of this.contextCache.entries()) {
      if (!this.isContextValid(cached.lastAccess)) {
        this.contextCache.delete(conversationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired contexts from cache`);
    }

    return cleanedCount;
  }

  /**
   * Obtener estadísticas del context manager
   */
  static getStats(): {
    cachedContexts: number;
    config: ContextManagerConfig;
    memoryUsage: number;
  } {
    this.cleanupExpiredContexts();
    
    // Calcular uso aproximado de memoria
    const memoryUsage = JSON.stringify(Array.from(this.contextCache.values())).length;
    
    return {
      cachedContexts: this.contextCache.size,
      config: this.getConfig(),
      memoryUsage
    };
  }

  /**
   * Crear contexto por defecto
   */
  private static createDefaultContext(): ConversationContext {
    return {
      lastMessages: [],
      variables: {},
      userPreferences: {
        preferredLanguage: 'es',
        preferredChannel: 'whatsapp',
        communicationStyle: 'casual',
        timezone: 'Europe/Madrid'
      }
    };
  }

  /**
   * Verificar si un contexto en cache sigue siendo válido
   */
  private static isContextValid(lastAccess: Date): boolean {
    const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
    const now = new Date();
    const timeDiff = now.getTime() - lastAccess.getTime();
    
    return timeDiff <= timeoutMs;
  }

  /**
   * Obtener configuración actual
   */
  static getConfig(): ContextManagerConfig {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(newConfig: Partial<ContextManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('ContextManager configuration updated:', this.config);
  }

  /**
   * Inicializar limpieza automática de contextos
   */
  static startCleanupInterval(): void {
    const intervalMs = this.config.contextCleanupIntervalMinutes * 60 * 1000;
    
    setInterval(() => {
      this.cleanupExpiredContexts();
    }, intervalMs);

    logger.info(`Context cleanup interval started: ${this.config.contextCleanupIntervalMinutes} minutes`);
  }

  /**
   * Forzar persistencia de todos los contextos en cache
   */
  static async flushContextsToDatabase(): Promise<number> {
    if (!this.config.persistContextToDatabase) {
      return 0;
    }

    let flushedCount = 0;
    
    for (const [conversationId, cached] of this.contextCache.entries()) {
      try {
        await ConversationModel.updateContext(conversationId, cached.context);
        flushedCount++;
      } catch (error) {
        logger.error(`Error flushing context for conversation ${conversationId}:`, error);
      }
    }

    logger.info(`Flushed ${flushedCount} contexts to database`);
    return flushedCount;
  }
}