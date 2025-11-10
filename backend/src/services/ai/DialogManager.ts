import { 
  AIResponse, 
  IntentClassificationResult, 
  ConversationContext, 
  DialogManagerConfig,
  AIAction
} from '../../types/ai';
import { Client } from '../../types/client';
import { ContextManager } from './ContextManager';
// import { BusinessLogicService } from './BusinessLogicService';
import logger from '../../utils/logger';

export class DialogManager {
  private static config: DialogManagerConfig = {
    defaultFlow: 'greeting',
    maxFlowSteps: 20,
    escalationThreshold: 3,
    enableFallbacks: true
  };

  /**
   * Generar respuesta basada en el resultado de NLU y contexto
   */
  static async generateResponse(
    conversationId: string,
    nluResult: IntentClassificationResult,
    context: ConversationContext,
    client: Client
  ): Promise<AIResponse> {
    try {
      let message = '';
      const actions: any[] = [];
      let needsHumanEscalation = false;

      // Procesar según la intención detectada
      switch (nluResult.intent.name) {
        case 'greeting':
          message = this.generateGreeting(client);
          break;

        case 'booking_request':
          if (context.currentFlow === 'booking' && context.pendingBooking) {
            // Continuar con el flujo de reserva existente
            message = 'Continuando con tu reserva...';
          } else {
            // Iniciar nuevo flujo de reserva
            message = 'Perfecto! Te ayudo a reservar tu cita. ¿Qué servicio te interesa?';
            await ContextManager.setCurrentFlow(conversationId, 'booking', 0);
            
            // Implementación temporal
            message += '\n\nTenemos servicios de facial, corporal, spa y más.';
          }
          break;

        case 'service_inquiry':
          const serviceEntity = nluResult.entities.find(e => e.type === 'service_name');
          if (serviceEntity) {
            message = `Te cuento sobre ${serviceEntity.value}. Es uno de nuestros tratamientos más populares. ¿Te gustaría reservar una cita?`;
          } else {
            message = 'Tenemos servicios de facial, corporal, spa y más. ¿Te interesa alguno en particular?';
          }
          break;

        case 'availability_check':
          const serviceForAvailability = nluResult.entities.find(e => e.type === 'service_name');
          if (serviceForAvailability) {
            message = `Tengo disponibilidad para ${serviceForAvailability.value}. ¿Qué fecha prefieres?`;
          } else {
            message = 'Te ayudo a consultar la disponibilidad. ¿Para qué servicio necesitas la cita?';
          }
          break;

        case 'price_inquiry':
          const serviceForPrice = nluResult.entities.find(e => e.type === 'service_name');
          if (serviceForPrice) {
            message = `El precio de ${serviceForPrice.value} es muy competitivo. ¿Te gustaría más detalles?`;
          } else {
            message = 'Nuestros precios van desde €25 hasta €85 dependiendo del tratamiento. ¿Te interesa algún servicio en particular?';
          }
          break;

        case 'cancel_booking':
          message = 'Te ayudo a cancelar tu cita. ¿Podrías darme más detalles sobre la cita que quieres cancelar?';
          needsHumanEscalation = true; // Escalación para manejo manual
          break;

        case 'reschedule_booking':
          message = 'Te ayudo a reprogramar tu cita. ¿Podrías darme los detalles de la cita actual y cuándo te gustaría cambiarla?';
          needsHumanEscalation = true; // Escalación para manejo manual
          break;

        case 'complaint':
          message = 'Lamento escuchar que has tenido una mala experiencia. Te voy a conectar con un especialista que podrá ayudarte mejor.';
          needsHumanEscalation = true;
          actions.push({
            type: 'escalate_to_human',
            params: { reason: 'complaint', priority: 'high' }
          });
          break;

        case 'goodbye':
          message = '¡Hasta pronto! Ha sido un placer ayudarte. 😊';
          actions.push({
            type: 'end_conversation',
            params: {}
          });
          break;

        case 'affirmative':
          if (context.currentFlow === 'booking' && context.pendingBooking) {
            message = '¡Perfecto! Procesando tu reserva...';
            actions.push({
              type: 'book_appointment',
              params: { clientId: client.id, ...context.pendingBooking }
            });
          } else {
            message = '¡Genial! ¿En qué más puedo ayudarte?';
          }
          break;

        case 'negative':
          message = await this.handleNegative(conversationId, context);
          break;

        default:
          // Verificar si hay entidades que podamos procesar
          if (nluResult.entities.length > 0) {
            const serviceEntity = nluResult.entities.find(e => e.type === 'service_name');
            if (serviceEntity) {
              message = `Te cuento sobre ${serviceEntity.value}. ¿Te gustaría más información o prefieres reservar una cita?`;
            } else {
              message = 'No estoy seguro de haber entendido completamente. ¿Podrías ser más específico?';
            }
          } else {
            message = 'No estoy seguro de haber entendido. ¿Podrías ser más específico? Puedo ayudarte con:\n\n• Reservar una cita\n• Consultar servicios\n• Ver disponibilidad\n• Hablar con un especialista';
          }
          needsHumanEscalation = nluResult.confidence < 0.5;
      }

      return {
        message,
        intent: nluResult.intent.name,
        entities: nluResult.entities,
        actions,
        needsHumanEscalation,
        metadata: {
          confidence: nluResult.confidence,
          flow: context.currentFlow
        }
      };

    } catch (error) {
      logger.error('Error generating dialog response:', error);
      
      return {
        message: 'Lo siento, ha ocurrido un error. ¿Podrías repetir tu consulta?',
        needsHumanEscalation: true,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Generar saludo personalizado
   */
  private static generateGreeting(client: Client): string {
    const firstName = client.name.split(' ')[0];
    return `¡Hola ${firstName}! 👋 Soy tu asistente virtual de la clínica de belleza. ¿En qué puedo ayudarte hoy?\n\n• Ver servicios disponibles\n• Reservar una cita\n• Consultar mi historial\n• Hablar con un especialista`;
  }



  /**
   * Manejar respuesta negativa
   */
  private static async handleNegative(conversationId: string, context: ConversationContext): Promise<string> {
    if (context.currentFlow === 'booking') {
      await ContextManager.clearContext(conversationId);
      return 'No hay problema. ¿Hay algo más en lo que pueda ayudarte?';
    }
    return 'Entendido. ¿Puedo ayudarte con algo más?';
  }

  /**
   * Obtener configuración actual
   */
  static getConfig(): DialogManagerConfig {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(newConfig: Partial<DialogManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('DialogManager configuration updated:', this.config);
  }
}