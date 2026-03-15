import { ConversationModel } from '@/models/Conversation';
import { ChatContext, ChatState } from '../types';
import logger from '@/utils/logger';

const MAX_CONTEXT_AGE_MINUTES = 60;

export class ContextPreserver {
  private static contextCache = new Map<string, {
    context: ChatContext;
    lastAccess: Date;
  }>();

  static async getOrCreateContext(
    clientId: string,
    channel: 'web' | 'whatsapp'
  ): Promise<{ conversation: any; context: ChatContext }> {
    let conversation = await ConversationModel.findByClientAndChannel(clientId, channel);

    if (!conversation) {
      conversation = await ConversationModel.create(clientId, channel);
      logger.info(`New conversation created: ${conversation.id} for client ${clientId}`);
    }

    const context = await this.loadContext(conversation.id, conversation.context);

    return { conversation, context };
  }

  static async loadContext(
    conversationId: string,
    dbContext: any
  ): Promise<ChatContext> {
    const cached = this.contextCache.get(conversationId);

    if (cached && this.isValid(cached.lastAccess)) {
      cached.lastAccess = new Date();
      return cached.context;
    }

    if (dbContext?.variables?.chatContext) {
      const savedChatContext = dbContext.variables.chatContext;
      const context: ChatContext = {
        currentState: savedChatContext.currentState || ChatState.GREETING,
        previousState: savedChatContext.previousState || null,
        selectedCategory: savedChatContext.selectedCategory || null,
        selectedServiceId: savedChatContext.selectedServiceId || null,
        selectedServiceName: savedChatContext.selectedServiceName || null,
        selectedServiceSlug: savedChatContext.selectedServiceSlug || null,
        selectedServicePrice: savedChatContext.selectedServicePrice || null,
        serviceOptions: savedChatContext.serviceOptions || [],
        lastBotMessage: savedChatContext.lastBotMessage || null,
        lastUserMessage: savedChatContext.lastUserMessage || null,
        awaitingOption: savedChatContext.awaitingOption || null,
        queryCount: savedChatContext.queryCount || 0,
        createdAt: savedChatContext.createdAt ? new Date(savedChatContext.createdAt) : new Date(),
        updatedAt: new Date()
      };
      this.contextCache.set(conversationId, {
        context,
        lastAccess: new Date()
      });
      return context;
    }

    if (dbContext?.chatContext) {
      const context = dbContext.chatContext as ChatContext;
      this.contextCache.set(conversationId, {
        context,
        lastAccess: new Date()
      });
      return context;
    }

    const newContext = this.createDefaultContext();
    await this.saveContext(conversationId, newContext);

    return newContext;
  }

  static async saveContext(
    conversationId: string,
    context: ChatContext
  ): Promise<void> {
    context.updatedAt = new Date();

    this.contextCache.set(conversationId, {
      context,
      lastAccess: new Date()
    });

    try {
      const conversation = await ConversationModel.findById(conversationId);
      if (conversation) {
        await ConversationModel.updateContext(conversationId, {
          currentIntent: context.currentState,
          lastMessages: conversation.context?.lastMessages || [],
          variables: {
            ...conversation.context?.variables,
            chatContext: {
              currentState: context.currentState,
              previousState: context.previousState,
              selectedCategory: context.selectedCategory,
              selectedServiceId: context.selectedServiceId,
              selectedServiceName: context.selectedServiceName,
              selectedServiceSlug: context.selectedServiceSlug,
              selectedServicePrice: context.selectedServicePrice,
              serviceOptions: context.serviceOptions,
              lastBotMessage: context.lastBotMessage,
              lastUserMessage: context.lastUserMessage,
              awaitingOption: context.awaitingOption,
              queryCount: context.queryCount
            }
          }
        });
      }
    } catch (error) {
      logger.error('Error saving context to DB:', error);
    }
  }

  static async saveContextToCache(
    conversationId: string,
    context: ChatContext
  ): Promise<void> {
    context.updatedAt = new Date();

    this.contextCache.set(conversationId, {
      context,
      lastAccess: new Date()
    });
  }

  static createDefaultContext(): ChatContext {
    return {
      currentState: ChatState.GREETING,
      previousState: null,
      selectedCategory: null,
      selectedServiceId: null,
      selectedServiceName: null,
      selectedServiceSlug: null,
      selectedServicePrice: null,
      serviceOptions: [],
      lastBotMessage: null,
      lastUserMessage: null,
      awaitingOption: null,
      queryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static clearContext(conversationId: string): void {
    this.contextCache.delete(conversationId);
  }

  static cleanup(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [id, cached] of this.contextCache.entries()) {
      if (!this.isValid(cached.lastAccess)) {
        this.contextCache.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  private static isValid(lastAccess: Date): boolean {
    const ageMs = Date.now() - lastAccess.getTime();
    const maxAgeMs = MAX_CONTEXT_AGE_MINUTES * 60 * 1000;
    return ageMs < maxAgeMs;
  }
}
