import { ConversationModel } from '../../models/Conversation';
import { ClientModel } from '../../models/Client';
import { ProcessMessageRequest, ProcessMessageResponse, MessageRouterConfig, ConversationChannel, AIResponse } from '../../types/ai';
import { ContextManager } from './ContextManager';
import { NLUService } from './NLUService';
import { EscalationService } from './EscalationService';
// import { DialogManager } from './DialogManager';
import logger from '../../utils/logger';

export class MessageRouter {
  private static config: MessageRouterConfig = {
    defaultChannel: 'whatsapp',
    maxMessageLength: 4000,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    rateLimitPerMinute: 60
  };

  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  /**
   * Procesar mensaje entrante y generar respuesta
   */
  static async processMessage(request: ProcessMessageRequest): Promise<ProcessMessageResponse> {
    const startTime = Date.now();
    
    try {
      // Validar entrada
      this.validateRequest(request);
      
      // Verificar rate limiting
      if (!this.checkRateLimit(request.clientId)) {
        throw new Error('Rate limit exceeded. Please wait before sending another message.');
      }

      // Obtener o crear cliente
      let client = await ClientModel.findById(request.clientId);
      if (!client) {
        // Intentar buscar por teléfono
        const phoneToSearch = request.channel === 'whatsapp' && request.metadata?.phone
          ? request.metadata.phone
          : `web_${request.clientId.substring(0, 8)}`;
        
        client = await ClientModel.findByPhone(phoneToSearch);
        
        // Si aún no existe, crear cliente temporal para chat web
        if (!client && request.channel === 'web') {
          try {
            client = await ClientModel.create({
              name: `Web Visitor ${request.clientId.substring(0, 8)}`,
              phone: phoneToSearch,
              email: request.metadata?.email || ''
            });
            logger.info(`New web client created: ${client.id} for web ID: ${request.clientId}`);
          } catch (error: any) {
            // Si falla por duplicado, intentar buscar de nuevo
            if (error.message?.includes('Duplicate entry')) {
              client = await ClientModel.findByPhone(phoneToSearch);
            }
            if (!client) throw error;
          }
        }
        
        if (client) {
          // Actualizar el clientId del request para usar el ID real de la BD
          request.clientId = client.id;
        } else {
          throw new Error('Client not found');
        }
      }

      // Obtener o crear conversación
      let conversation = await ConversationModel.findByClientAndChannel(client.id, request.channel);
      if (!conversation) {
        conversation = await ConversationModel.create(client.id, request.channel);
        logger.info(`New conversation created: ${conversation.id} for client ${client.id}`);
      }

      // Guardar mensaje del cliente
      logger.info('Saving client message...', { metadata: request.metadata });
      const clientMessage = await ConversationModel.addMessage(conversation.id, {
        senderType: 'client',
        content: request.content,
        mediaUrl: request.mediaUrl,
        metadata: request.metadata
      });
      logger.info('Client message saved:', { messageId: clientMessage.id });

      // Actualizar contexto con el nuevo mensaje
      logger.info('Updating context...');
      await ContextManager.addMessageToContext(conversation.id, clientMessage);
      logger.info('Context updated');

      // Procesar mensaje con NLU
      const nluResult = await NLUService.processMessage(request.content, conversation.context);
      
      // Evaluar necesidad de escalación
      const escalationEvaluation = await EscalationService.evaluateEscalationNeed(
        conversation.id,
        nluResult,
        conversation.context,
        client
      );

      let aiResponse: AIResponse;

      if (escalationEvaluation.shouldEscalate) {
        // Ejecutar escalación automática
        const escalationResult = await EscalationService.escalateToHuman(
          conversation.id,
          escalationEvaluation.reason!,
          escalationEvaluation.priority!,
          escalationEvaluation.summary
        );

        if (escalationResult.success) {
          aiResponse = {
            message: this.generateEscalationMessage(escalationEvaluation.reason!),
            intent: nluResult.intent.name,
            entities: nluResult.entities,
            needsHumanEscalation: true,
            metadata: {
              escalationId: escalationResult.escalationId,
              escalationReason: escalationEvaluation.reason
            }
          };
        } else {
          aiResponse = {
            message: 'Lo siento, ha ocurrido un problema. Un especialista te contactará pronto.',
            intent: nluResult.intent.name,
            entities: nluResult.entities,
            needsHumanEscalation: true
          };
        }
      } else {
        // Generar respuesta base
        let responseMessage = this.generateSimpleResponse(nluResult.intent.name, client.name);
        
        // Solo buscar en la base de conocimientos si es una pregunta específica (no saludos ni despedidas)
        const shouldSearchKnowledge = !['greeting', 'goodbye', 'thanks'].includes(nluResult.intent.name) 
          && request.content.includes('?');
        
        if (shouldSearchKnowledge) {
          try {
            const { KnowledgeService } = await import('../KnowledgeService');
            const knowledgeAnswer = await KnowledgeService.getFormattedAnswer(request.content, conversation.id);
            
            if (knowledgeAnswer) {
              responseMessage = knowledgeAnswer;
            }
          } catch (error) {
            logger.warn('Error fetching knowledge base:', error);
            // Continuar con la respuesta simple si falla
          }
        }
        
        aiResponse = {
          message: responseMessage,
          intent: nluResult.intent.name,
          entities: nluResult.entities,
          needsHumanEscalation: nluResult.needsHumanEscalation || false
        };
      }

      // Guardar respuesta del AI
      const aiMessage = await ConversationModel.addMessage(conversation.id, {
        senderType: 'ai',
        content: aiResponse.message,
        metadata: {
          intent: aiResponse.intent,
          entities: aiResponse.entities,
          actions: aiResponse.actions
        }
      });

      // Actualizar contexto con la respuesta
      await ContextManager.addMessageToContext(conversation.id, aiMessage);

      // Ejecutar acciones si las hay
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        await this.executeActions(aiResponse.actions, conversation.id, client.id);
      }

      // Manejar escalación si es necesaria
      if (aiResponse.needsHumanEscalation) {
        await ConversationModel.escalateConversation(
          conversation.id,
          'AI confidence low or complex request'
        );
        logger.info(`Conversation escalated: ${conversation.id}`);
      }

      // Cerrar conversación si terminó
      if (aiResponse.conversationEnded) {
        await ConversationModel.closeConversation(conversation.id);
        logger.info(`Conversation closed: ${conversation.id}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        response: aiResponse,
        conversationId: conversation.id,
        messageId: aiMessage.id,
        processingTime
      };

    } catch (error) {
      logger.error('Message processing error:', error);
      
      // Respuesta de fallback
      const fallbackResponse: AIResponse = {
        message: 'Lo siento, ha ocurrido un error. Un agente humano te contactará pronto.',
        needsHumanEscalation: true,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      const processingTime = Date.now() - startTime;

      return {
        response: fallbackResponse,
        conversationId: 'error',
        messageId: 'error',
        processingTime
      };
    }
  }

  /**
   * Procesar mensaje de WhatsApp (webhook de Twilio)
   */
  static async processWhatsAppMessage(twilioPayload: any): Promise<ProcessMessageResponse> {
    try {
      // Extraer información del payload de Twilio
      const phoneNumber = this.extractPhoneNumber(twilioPayload.From);
      const content = twilioPayload.Body || '';
      const mediaUrl = twilioPayload.MediaUrl0;
      
      // Buscar cliente por número de teléfono
      let client = await ClientModel.findByPhone(phoneNumber);
      if (!client) {
        // Crear cliente automáticamente para WhatsApp
        client = await ClientModel.create({
          phone: phoneNumber,
          name: `Cliente WhatsApp ${phoneNumber.slice(-4)}`,
          allergies: [],
          preferences: []
        });
        logger.info(`Auto-created client for WhatsApp: ${client.id}`);
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

    } catch (error) {
      logger.error('WhatsApp message processing error:', error);
      throw error;
    }
  }

  /**
   * Validar request de entrada
   */
  private static validateRequest(request: ProcessMessageRequest): void {
    if (!request.content || request.content.trim().length === 0) {
      throw new Error('Message content is required');
    }

    if (request.content.length > this.config.maxMessageLength) {
      throw new Error(`Message too long. Maximum ${this.config.maxMessageLength} characters allowed`);
    }

    if (!request.clientId) {
      throw new Error('Client ID is required');
    }

    if (!['web', 'whatsapp'].includes(request.channel)) {
      throw new Error('Invalid channel. Must be web or whatsapp');
    }

    // Validar tipo de media si está presente
    if (request.mediaUrl && request.metadata?.mediaType) {
      if (!this.config.supportedMediaTypes.includes(request.metadata.mediaType)) {
        throw new Error(`Unsupported media type: ${request.metadata.mediaType}`);
      }
    }
  }

  /**
   * Verificar rate limiting por cliente
   */
  private static checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    
    const clientLimit = this.rateLimitMap.get(clientId);
    
    if (!clientLimit || now > clientLimit.resetTime) {
      // Nueva ventana de tiempo
      this.rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (clientLimit.count >= this.config.rateLimitPerMinute) {
      return false;
    }

    clientLimit.count++;
    return true;
  }

  /**
   * Ejecutar acciones del AI
   */
  private static async executeActions(actions: any[], conversationId: string, clientId: string): Promise<void> {
    // const { BusinessLogicService } = await import('./BusinessLogicService');
    
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'book_appointment':
            logger.info(`Booking action executed for conversation ${conversationId}:`, action.params);
            // TODO: Implementar lógica de reserva real
            break;
          case 'check_availability':
            await this.executeAvailabilityCheck(action.params, conversationId);
            break;
          case 'get_services':
            await this.executeGetServices(action.params, conversationId);
            break;
          case 'get_client_info':
            await this.executeGetClientInfo(action.params, conversationId, clientId);
            break;
          case 'send_notification':
            await this.executeSendNotificationAction(action.params, clientId);
            break;
          case 'escalate_to_human':
            await ConversationModel.escalateConversation(
              conversationId, 
              action.params.reason || 'AI escalation',
              action.params.humanAgentId
            );
            break;
          case 'end_conversation':
            await ConversationModel.closeConversation(conversationId);
            break;
          default:
            logger.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        logger.error(`Error executing action ${action.type}:`, error);
      }
    }
  }

  /**
   * Ejecutar verificación de disponibilidad
   */
  private static async executeAvailabilityCheck(params: any, conversationId: string): Promise<void> {
    logger.info(`Availability check executed for conversation ${conversationId}:`, params);
    // La lógica ya está integrada en BusinessLogicService
  }

  /**
   * Ejecutar obtención de servicios
   */
  private static async executeGetServices(params: any, conversationId: string): Promise<void> {
    logger.info(`Get services executed for conversation ${conversationId}:`, params);
    // La lógica ya está integrada en BusinessLogicService
  }

  /**
   * Ejecutar obtención de información del cliente
   */
  private static async executeGetClientInfo(params: any, conversationId: string, clientId: string): Promise<void> {
    logger.info(`Get client info executed for conversation ${conversationId}, client ${clientId}:`, params);
    // La lógica ya está integrada en BusinessLogicService
  }

  /**
   * Ejecutar acción de envío de notificación
   */
  private static async executeSendNotificationAction(params: any, clientId: string): Promise<void> {
    try {
      const { NotificationService } = await import('../NotificationService');
      
      await NotificationService.createNotification({
        clientId,
        type: params.type || 'promotion',
        channel: params.channel || 'whatsapp',
        scheduledFor: params.scheduledFor || new Date(),
        templateName: params.templateName || 'general_message',
        templateData: params.templateData || {}
      });
      
      logger.info(`Notification scheduled for client ${clientId}`);
    } catch (error) {
      logger.error(`Error sending notification to client ${clientId}:`, error);
    }
  }

  /**
   * Extraer número de teléfono limpio
   */
  private static extractPhoneNumber(twilioFrom: string): string {
    // Remover prefijo "whatsapp:" si existe
    return twilioFrom.replace('whatsapp:', '').replace(/\s+/g, '');
  }

  /**
   * Obtener configuración actual
   */
  static getConfig(): MessageRouterConfig {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(newConfig: Partial<MessageRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('MessageRouter configuration updated:', this.config);
  }

  /**
   * Limpiar rate limits expirados
   */
  static cleanupRateLimits(): void {
    const now = Date.now();
    for (const [clientId, limit] of this.rateLimitMap.entries()) {
      if (now > limit.resetTime) {
        this.rateLimitMap.delete(clientId);
      }
    }
  }

  /**
   * Generar respuesta simple basada en la intención
   */
  private static generateSimpleResponse(intent: string, clientName: string): string {
    const firstName = clientName.split(' ')[0];
    
    switch (intent) {
      case 'greeting':
        return `¡Hola ${firstName}! 👋 Soy tu asistente virtual de la Clínica de Belleza.\n\n¿En qué puedo ayudarte hoy?\n• Ver servicios disponibles\n• Reservar una cita\n• Consultar precios\n• Información sobre tratamientos`;
      case 'booking_request':
        return `Perfecto ${firstName}, te ayudo a reservar tu cita. 📅\n\n¿Qué servicio te interesa? Puedo ayudarte con:\n• Tratamientos faciales\n• Tratamientos corporales\n• Manicure y pedicure\n• Masajes y spa`;
      case 'service_inquiry':
        return `Claro ${firstName}, déjame ayudarte con información sobre nuestros servicios. ¿Qué tipo de tratamiento te interesa?`;
      case 'product_inquiry':
        return `Con gusto te informo sobre nuestros productos. ¿Buscas algo específico?`;
      case 'price_inquiry':
        return `Te puedo ayudar con información de precios. ¿Qué servicio o producto te interesa?`;
      case 'goodbye':
        return `¡Hasta pronto ${firstName}! Ha sido un placer ayudarte. 😊\n\nSi necesitas algo más, aquí estaré.`;
      default:
        return `Entiendo ${firstName}. ¿Podrías darme más detalles sobre lo que necesitas? Puedo ayudarte con servicios, reservas, precios o cualquier consulta sobre nuestros tratamientos.`;
    }
  }

  /**
   * Generar mensaje de escalación según la razón
   */
  private static generateEscalationMessage(reason: string): string {
    switch (reason) {
      case 'complaint':
        return 'Entiendo tu preocupación y quiero asegurarme de que recibas la mejor atención. Te voy a conectar con uno de nuestros especialistas que podrá ayudarte mejor. Un momento por favor...';
      
      case 'failed_attempts':
        return 'Veo que hemos tenido algunas dificultades para entendernos. Permíteme conectarte con un agente humano que podrá asistirte de manera más personalizada.';
      
      case 'complex_request':
        return 'Tu consulta requiere atención especializada. Te voy a transferir con uno de nuestros expertos que podrá darte una respuesta más detallada.';
      
      case 'payment_issue':
        return 'Para asuntos relacionados con pagos, es mejor que hables directamente con nuestro equipo especializado. Te conecto ahora mismo.';
      
      case 'client_request':
        return 'Por supuesto, te conecto con un agente humano. Un momento por favor...';
      
      case 'technical_issue':
        return 'Ha ocurrido un problema técnico. Un especialista te contactará para asistirte.';
      
      default:
        return 'Te voy a conectar con uno de nuestros especialistas para brindarte la mejor atención posible. Un momento por favor...';
    }
  }

  /**
   * Obtener estadísticas del router
   */
  static getStats(): {
    activeRateLimits: number;
    config: MessageRouterConfig;
  } {
    this.cleanupRateLimits();
    
    return {
      activeRateLimits: this.rateLimitMap.size,
      config: this.getConfig()
    };
  }
}