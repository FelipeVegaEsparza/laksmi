import { ChatState, StateContext, Service, ServiceOption } from './types';
import { serviceMatcher, bookingLinkGenerator } from './services';
import { handleFreeQuery } from './states/FreeQueryState';
import logger from '../../utils/logger';

interface FlowResult {
  message: string;
  nextState: ChatState;
  selectedCategory?: string;
  selectedService?: Service;
  serviceOptions?: ServiceOption[];
  awaitingOption?: 'category' | 'service' | 'detail' | 'booking';
  metadata?: Record<string, any>;
  isFreeQuery?: boolean;
}

export class ConversationFlow {

  static async process(message: string, context: StateContext): Promise<FlowResult> {
    const { chatContext, services, categories } = context;
    const normalizedMessage = message.toLowerCase().trim();

    logger.info('ConversationFlow processing', {
      currentState: chatContext.currentState,
      awaitingOption: chatContext.awaitingOption,
      message: normalizedMessage.substring(0, 50)
    });

    let result: FlowResult;

    switch (chatContext.awaitingOption) {
      case 'category':
        result = this.handleCategorySelection(message, context);
        break;

      case 'service':
        result = this.handleServiceSelection(message, context);
        break;

      case 'detail':
        result = this.handleDetailSelection(message, context);
        break;

      case 'booking':
        result = this.handleBookingSelection(message, context);
        break;

      default:
        result = await this.handleFreeInput(message, context);
    }

    if ((result as any).isFreeQuery) {
      const history = (context as any).history || [];
      const freeQueryResult = await handleFreeQuerySync(message, history);
      return {
        message: freeQueryResult.message,
        nextState: freeQueryResult.nextState,
        metadata: freeQueryResult.metadata
      };
    }

    return result;
  }

  private static handleCategorySelection(message: string, context: StateContext): FlowResult {
    const { services, categories, chatContext } = context;
    const num = this.extractNumber(message);

    if (num && num >= 1 && num <= 3) {
      if (num === 1) {
        return this.showCategories(context);
      } else if (num === 2) {
        return {
          message: 'Perfecto, estoy aquí para responder tus preguntas. 😊\n\n¿Qué te gustaría saber sobre nuestros servicios o tratamientos?',
          nextState: ChatState.FREE_QUERY,
          awaitingOption: undefined
        };
      } else if (num === 3) {
        return this.showCategories(context, true);
      }
    }

    if (this.isFreeQuery(message)) {
      return {
        nextState: ChatState.FREE_QUERY,
        awaitingOption: undefined,
        message: '',
        isFreeQuery: true
      };
    }

    if (num && num >= 1 && num <= categories.length) {
      const category = categories[num - 1];
      const categoryServices = serviceMatcher.getServicesByCategory(category.name);

      if (categoryServices.length === 0) {
        return {
          message: `No hay servicios en ${category.name} actualmente.\n\n${this.generateCategoriesMenu(categories)}`,
          nextState: ChatState.SERVICE_CATEGORY,
          awaitingOption: 'category'
        };
      }

      let serviceList = `Estos son los servicios de ${category.name}:\n\n`;

      categoryServices.forEach((service, i) => {
        const price = service.price ? `$${service.price.toLocaleString('es-CL')}` : 'Consultar';
        const sessions = service.sessions ? ` (${service.sessions} sesiones)` : '';
        serviceList += `${i + 1}. *${service.name}${sessions}* - ${price}\n`;
      });

      serviceList += '\n⚠️ Responde con el número del servicio que te interesa.';

      return {
        message: serviceList,
        nextState: ChatState.SERVICE_LIST,
        selectedCategory: category.name,
        serviceOptions: categoryServices.map(s => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          price: s.price,
          category: s.category
        })),
        awaitingOption: 'service'
      };
    }

    return {
      message: 'Por favor, responde con el número de tu opción.\n\n' + this.generateCategoriesMenu(categories),
      nextState: ChatState.SERVICE_CATEGORY,
      awaitingOption: 'category'
    };
  }

  private static handleServiceSelection(message: string, context: StateContext): FlowResult {
    const { services, chatContext } = context;
    const num = this.extractNumber(message);

    if (!num) {
      if (this.isFreeQuery(message)) {
        return {
          message: '',
          nextState: ChatState.FREE_QUERY,
          awaitingOption: undefined,
          isFreeQuery: true
        } as FlowResult;
      }

      const service = serviceMatcher.fuzzyMatch(message);
      if (service) {
        return this.showServiceDetails(service, context);
      }

      return {
        message: 'No entendí. Responde con el número del servicio o escribe el nombre.',
        nextState: ChatState.SERVICE_LIST,
        awaitingOption: 'service'
      };
    }

    const serviceOptions = chatContext.serviceOptions || [];
    if (num >= 1 && num <= serviceOptions.length) {
      const selected = serviceOptions[num - 1];
      const fullService = serviceMatcher.findById(selected.id);

      if (fullService) {
        return this.showServiceDetails(fullService, context);
      }
    }

    return {
      message: `Número inválido. Hay ${serviceOptions.length} servicios. Responde con un número del 1 al ${serviceOptions.length}.`,
      nextState: ChatState.SERVICE_LIST,
      awaitingOption: 'service'
    };
  }

  private static handleDetailSelection(message: string, context: StateContext): FlowResult {
    const { chatContext } = context;
    const num = this.extractNumber(message);
    const serviceId = chatContext.selectedServiceId;

    if (this.isFreeQuery(message)) {
      return {
        message: '',
        nextState: ChatState.FREE_QUERY,
        awaitingOption: undefined,
        isFreeQuery: true
      } as FlowResult;
    }

    if (!serviceId) {
      return {
        message: 'Lo siento, perdí el contexto. Volvamos al inicio.\n\n' + this.generateCategoriesMenu(serviceMatcher.getCategories()),
        nextState: ChatState.SERVICE_CATEGORY,
        awaitingOption: 'category'
      };
    }

    const service = serviceMatcher.findById(serviceId);

    if (!service) {
      return {
        message: 'No encontré el servicio. ¿Qué te gustaría hacer?\n\n1. Ver servicios\n2. Hacer consulta\n3. Agendar',
        nextState: ChatState.SERVICE_CATEGORY,
        awaitingOption: 'category'
      };
    }

    if (!num || num < 1 || num > 4) {
      return {
        message: 'Responde con 1, 2, 3 o 4.',
        nextState: ChatState.SERVICE_DETAIL,
        awaitingOption: 'detail',
        selectedService: service
      };
    }

    switch (num) {
      case 1:
        return {
          message: `💰 Precio de ${service.name}:

• Precio: $${service.price?.toLocaleString('es-CL') || 'Consultar'}
• Sesiones: ${service.sessions || 'Consultar'}
• Duración: ${service.duration || 'Consultar'} minutos

¿Qué más quieres saber?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ Responde con el número.`,
          nextState: ChatState.SERVICE_DETAIL,
          awaitingOption: 'detail',
          selectedService: service
        };

      case 2:
        return {
          message: `⏱️ Duración de ${service.name}:

• Por sesión: ${service.duration || 'Consultar'} minutos
• Total de sesiones: ${service.sessions || 'Consultar'}
• Tiempo total: Aproximadamente ${service.sessions && service.duration
            ? Math.ceil(service.sessions * service.duration / 60)
            : 'Consultar'} horas

¿Qué más quieres saber?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ Responde con el número.`,
          nextState: ChatState.SERVICE_DETAIL,
          awaitingOption: 'detail',
          selectedService: service
        };

      case 3:
        return {
          message: `✨ Beneficios de ${service.name}:

${service.benefits || 'Tratamiento profesional de alta calidad.'}

${service.description ? `\n📝 ${service.description}` : ''}

¿Qué más quieres saber?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ Responde con el número.`,
          nextState: ChatState.SERVICE_DETAIL,
          awaitingOption: 'detail',
          selectedService: service
        };

      case 4:
        const bookingLink = bookingLinkGenerator.generateFromService(service);
        return {
          message: `📅 Reserva tu cita de ${service.name}:

${bookingLink}

¿Te gustaría algo más?`,
          nextState: ChatState.BOOKING,
          awaitingOption: undefined,
          selectedService: service,
          metadata: { bookingLink }
        };

      default:
        return {
          message: 'Responde con 1, 2, 3 o 4.',
          nextState: ChatState.SERVICE_DETAIL,
          awaitingOption: 'detail',
          selectedService: service
        };
    }
  }

  private static handleBookingSelection(message: string, context: StateContext): FlowResult {
    const { chatContext } = context;

    if (this.isAffirmative(message)) {
      const serviceId = chatContext.selectedServiceId;
      if (serviceId) {
        const service = serviceMatcher.findById(serviceId);
        if (service) {
          const bookingLink = bookingLinkGenerator.generateFromService(service);
          return {
            message: `📅 Aquí está el link para reservar ${service.name}:

${bookingLink}

¿Te puedo ayudar con algo más?`,
            nextState: ChatState.BOOKING,
            metadata: { bookingLink }
          };
        }
      }
    }

    return {
      message: '¿Hay algo más en lo que pueda ayudarte?\n\n1. Ver servicios\n2. Hacer consulta\n3. Volver al inicio',
      nextState: ChatState.SERVICE_CATEGORY,
      awaitingOption: 'category'
    };
  }

  private static async handleFreeInput(message: string, context: StateContext): Promise<FlowResult> {
    const { chatContext } = context;

    if (chatContext.currentState === ChatState.FREE_QUERY) {
      const history = (context as any).history || [];
      const result = await handleFreeQuerySync(message, history);
      return {
        message: result.message,
        nextState: result.nextState,
        metadata: result.metadata
      };
    }

    if (this.isFreeQuery(message)) {
      const history = (context as any).history || [];
      const result = await handleFreeQuerySync(message, history);
      return {
        message: result.message,
        nextState: ChatState.FREE_QUERY,
        metadata: result.metadata
      };
    }

    return {
      message: '¿Qué te gustaría hacer?\n\n1. Ver servicios\n2. Hacer consulta\n3. Agendar',
      nextState: ChatState.SERVICE_CATEGORY,
      awaitingOption: 'category'
    };
  }

  private static showCategories(context: StateContext, forBooking = false): FlowResult {
    const categories = serviceMatcher.getCategories();

    let message = forBooking
      ? '¡Perfecto! Primero dime qué categoría te interesa.\n\n'
      : 'Estas son nuestras categorías de servicios:\n\n';

    message += this.generateCategoriesMenu(categories);

    return {
      message,
      nextState: ChatState.SERVICE_CATEGORY,
      awaitingOption: 'category'
    };
  }

  private static showServiceDetails(service: Service, context: StateContext): FlowResult {
    return {
      message: `¿Qué información necesitas de *${service.name}*?

1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ Responde con el número.`,
      nextState: ChatState.SERVICE_DETAIL,
      awaitingOption: 'detail',
      selectedService: service,
      metadata: { serviceId: service.id, serviceName: service.name }
    };
  }

  private static generateCategoriesMenu(categories: { name: string; count: number }[]): string {
    let menu = '';

    categories.forEach((cat, i) => {
      menu += `${i + 1}. ${cat.name}\n`;
    });

    menu += '\n⚠️ Responde con el número de la categoría.';
    return menu;
  }

  private static extractNumber(message: string): number | null {
    const match = message.trim().match(/^\d+$/);
    return match ? parseInt(match[0], 10) : null;
  }

  private static isAffirmative(message: string): boolean {
    const affirmative = ['sí', 'si', 'claro', 'ok', 'perfecto', 'dale', 'si,', 'sí,', 'confirmo', 'quiero', 'agendar', 'reservar'];
    const normalized = message.toLowerCase().trim();
    return affirmative.some(a => normalized === a || normalized.startsWith(a + ' '));
  }

  private static isFreeQuery(message: string): boolean {
    const normalized = message.toLowerCase().trim();
    
    const questionPatterns = [
      '?',
      '¿',
      'donde', 'dónde',
      'como', 'cómo',
      'cuanto', 'cuánto',
      'cual', 'cuál',
      'cuando', 'cuándo',
      'por que', 'por qué',
      'necesito saber',
      'me pueden decir',
      'tienen información',
      'quiero saber',
      'me gustaría saber',
      'horario',
      'ubicación',
      'dirección',
      'direccion',
      'teléfono',
      'telefono',
      'contacto',
      'abi',
      'cerrado',
      'ubicados'
    ];
    
    return questionPatterns.some(p => normalized.includes(p));
  }
}

async function handleFreeQuerySync(
  message: string,
  history: { role: string; content: string }[]
): Promise<{ message: string; nextState: ChatState; metadata?: Record<string, any> }> {
  return handleFreeQuery(message, history);
}
