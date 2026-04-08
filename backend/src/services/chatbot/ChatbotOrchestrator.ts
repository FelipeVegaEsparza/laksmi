import { ConversationModel } from '../../models/Conversation';
import { ClientModel } from '../../models/Client';
import {
  ProcessMessageRequest,
  ProcessMessageResponse,
  ChatState,
  ChatContext,
  Service,
  Category
} from './types';
import { ContextPreserver } from './services/ContextPreserver';
import { serviceMatcher, bookingLinkGenerator, knowledgeBase } from './services';
import { ConversationFlow } from './ConversationFlow';
import { handleFreeQuery } from './states/FreeQueryState';
import logger from '../../utils/logger';

export class ChatbotOrchestrator {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info('Initializing ChatbotOrchestrator...');

    await serviceMatcher.loadServices();
    await knowledgeBase.load();

    this.initialized = true;
    logger.info('ChatbotOrchestrator initialized successfully');
  }

  static async processMessage(request: ProcessMessageRequest): Promise<ProcessMessageResponse> {
    const startTime = Date.now();

    try {
      await this.initialize();

      const { CompanySettingsModel } = await import('../../models/CompanySettings');
      const settings = await CompanySettingsModel.getSettings();

      if (settings?.maintenanceMode) {
        return this.createResponse(
          '🔧 Estamos realizando mantenimiento. Por favor, intenta en unos minutos.',
          'maintenance',
          request.clientId,
          'maintenance',
          startTime
        );
      }

      this.validateRequest(request);

      const { conversation, context: chatContext } = await ContextPreserver.getOrCreateContext(
        request.clientId,
        request.channel
      );

      const client = await ClientModel.findById(request.clientId);

      const userMessageResult = await this.saveUserMessage(conversation.id, request);

      const services = serviceMatcher.getAllServices();
      const categories = serviceMatcher.getCategories();

      const stateContext = {
        clientId: request.clientId,
        conversationId: conversation.id,
        channel: request.channel,
        chatContext,
        userMessage: request.content,
        services,
        categories
      };

      let response: string;
      let nextState: ChatState;
      let metadata: Record<string, any> = {};

      if (this.isGreeting(request.content)) {
        response = this.generateGreeting(client?.name);
        nextState = ChatState.SERVICE_CATEGORY;
        chatContext.currentState = nextState;
        chatContext.awaitingOption = 'category';
      } else if (this.isExplicitBooking(request.content)) {
        const service = serviceMatcher.fuzzyMatch(request.content);
        if (service) {
          const bookingLink = bookingLinkGenerator.generateFromService(service);
          response = this.generateBookingResponse(service.name, bookingLink);
          nextState = ChatState.BOOKING;
          metadata = { bookingLink, serviceId: service.id, serviceName: service.name };
          chatContext.selectedServiceId = service.id;
          chatContext.selectedServiceName = service.name;
          chatContext.selectedServiceSlug = service.slug;
        } else {
          response = 'Para agendar necesito saber qué servicio te interesa. ¿Cuál tratamiento te gustaría?';
          nextState = ChatState.SERVICE_CATEGORY;
          chatContext.currentState = nextState;
          chatContext.awaitingOption = 'category';
        }
      } else {
        const flowResult = await ConversationFlow.process(request.content, stateContext);
        response = flowResult.message;
        nextState = flowResult.nextState;
        metadata = flowResult.metadata || {};

        chatContext.currentState = nextState;
        if (flowResult.selectedCategory) {
          chatContext.selectedCategory = flowResult.selectedCategory;
        }
        if (flowResult.selectedService) {
          chatContext.selectedServiceId = flowResult.selectedService.id;
          chatContext.selectedServiceName = flowResult.selectedService.name;
          chatContext.selectedServiceSlug = flowResult.selectedService.slug;
          chatContext.selectedServicePrice = flowResult.selectedService.price;
        }
        if (flowResult.serviceOptions) {
          chatContext.serviceOptions = flowResult.serviceOptions;
        }
        if (flowResult.awaitingOption) {
          chatContext.awaitingOption = flowResult.awaitingOption;
        }
      }

      chatContext.lastUserMessage = request.content;
      chatContext.lastBotMessage = response;

      await ContextPreserver.saveContext(conversation.id, chatContext);

      // Si se necesita escalación humana, escalar la conversación
      if (nextState === ChatState.ESCALATION || metadata.needsHumanEscalation) {
        await ConversationModel.escalateConversation(
          conversation.id,
          metadata.escalationReason || 'user_requested',
          undefined // No hay agente asignado aún
        );
        logger.info(`Conversation escalated to human agent`, {
          conversationId: conversation.id,
          reason: metadata.escalationReason || 'user_requested'
        });
      }

      const aiMessage = await ConversationModel.addMessage(conversation.id, {
        senderType: 'ai',
        content: response,
        metadata: {
          state: nextState,
          ...metadata
        }
      });

      const processingTime = Date.now() - startTime;

      logger.info(`Chatbot processed message`, {
        conversationId: conversation.id,
        state: nextState,
        processingTime
      });

      return {
        response: {
          message: response,
          intent: nextState,
          entities: [],
          needsHumanEscalation: nextState === ChatState.ESCALATION,
          metadata
        },
        conversationId: conversation.id,
        clientId: request.clientId,
        messageId: aiMessage.id,
        clientMessageId: userMessageResult.id,
        processingTime
      };

    } catch (error: any) {
      logger.error('ChatbotOrchestrator error:', error);

      return {
        response: {
          message: 'Lo siento, hubo un error. Un agente te contactará pronto.',
          intent: 'error',
          entities: [],
          needsHumanEscalation: true,
          metadata: { error: error.message }
        },
        conversationId: 'error',
        clientId: request.clientId,
        messageId: 'error',
        processingTime: Date.now() - startTime
      };
    }
  }

  private static isGreeting(message: string): boolean {
    const greetings = ['hola', 'buenos días', 'buenas', 'hello', 'hi', 'hey', 'saludos'];
    const normalized = message.toLowerCase().trim();
    return greetings.some(g => normalized.startsWith(g));
  }

  private static isExplicitBooking(message: string): boolean {
    const bookingWords = [
      'quiero agendar', 'quiero reservar', 'agendar cita', 'reservar hora',
      'necesito cita', 'pedir hora', 'reservar', 'agendar'
    ];
    const normalized = message.toLowerCase();
    return bookingWords.some(b => normalized.includes(b));
  }

  private static generateGreeting(clientName?: string): string {
    const name = clientName && !clientName.startsWith('Web Visitor')
      ? clientName.split(' ')[0]
      : '';
    
    const greeting = name ? `¡Hola ${name}! 😊` : '¡Hola! 😊';

    return `${greeting}

¿En qué puedo ayudarte hoy?

1. Ver servicios
2. Hacer una consulta
3. Agendar una cita
4. Chatear con un ejecutivo

⚠️ Responde con el número de tu opción.`;
  }

  private static generateBookingResponse(serviceName: string, bookingLink: string): string {
    return `¡Perfecto! Te ayudo a agendar tu tratamiento de ${serviceName}. 😊

📅 Reserva tu cita aquí:

${bookingLink}

¿Te gustaría algo más?`;
  }

  private static async saveUserMessage(conversationId: string, request: ProcessMessageRequest): Promise<{ id: string }> {
    logger.info('💾 Saving user message', { conversationId, content: request.content.substring(0, 30) });
    const message = await ConversationModel.addMessage(conversationId, {
      senderType: 'client',
      content: request.content,
      mediaUrl: request.mediaUrl,
      metadata: request.metadata
    });
    logger.info('✅ User message saved', { messageId: message.id });
    return { id: message.id };
  }

  private static validateRequest(request: ProcessMessageRequest): void {
    if (!request.content?.trim()) {
      throw new Error('Message content is required');
    }
    if (!request.clientId) {
      throw new Error('Client ID is required');
    }
    if (!['web', 'whatsapp'].includes(request.channel)) {
      throw new Error('Invalid channel');
    }
  }

  private static createResponse(
    message: string,
    intent: string,
    clientId: string,
    conversationId: string,
    startTime: number
  ): ProcessMessageResponse {
    return {
      response: {
        message,
        intent,
        entities: [],
        needsHumanEscalation: false,
        metadata: {}
      },
      conversationId,
      clientId,
      messageId: 'system',
      processingTime: Date.now() - startTime
    };
  }

  static async processWhatsAppMessage(twilioPayload: any): Promise<ProcessMessageResponse> {
    const phoneNumber = this.extractPhoneNumber(twilioPayload.From);
    const content = twilioPayload.Body || '';
    const mediaUrl = twilioPayload.MediaUrl0;

    let client = await ClientModel.findByPhone(phoneNumber);
    if (!client) {
      client = await ClientModel.create({
        phone: phoneNumber,
        name: `Cliente WhatsApp ${phoneNumber.slice(-4)}`,
        allergies: [],
        preferences: []
      });
    }

    const request: ProcessMessageRequest = {
      content,
      clientId: client.id,
      channel: 'whatsapp',
      mediaUrl,
      metadata: {
        phone: phoneNumber,
        twilioSid: twilioPayload.MessageSid,
        twilioFrom: twilioPayload.From,
        twilioTo: twilioPayload.To
      }
    };

    return await this.processMessage(request);
  }

  private static extractPhoneNumber(twilioFrom: string): string {
    return twilioFrom.replace('whatsapp:', '').replace(/\s+/g, '');
  }

  static getStats() {
    return {
      activeRateLimits: 0,
      config: this.getConfig()
    };
  }

  static getConfig() {
    return {
      defaultChannel: 'whatsapp',
      maxMessageLength: 4000,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      rateLimitPerMinute: 60
    };
  }

  static updateConfig(config: any): void {
    logger.info('ChatbotOrchestrator config updated:', config);
  }
}
