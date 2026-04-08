import OpenAI from 'openai';
import { ChatState } from '../types';
import { knowledgeBase, serviceMatcher, bookingLinkGenerator } from '../services';
import logger from '@/utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
});

const SYSTEM_PROMPT = `Eres un asistente virtual amigable de una clínica de belleza.

REGLAS:
1. Responde de forma clara y concisa
2. Usa emojis ocasionalmente
3. Si el usuario pregunta por un servicio específico, menciona el nombre y precio
4. Si el usuario quiere agendar, pregunta qué servicio le interesa
5. Si no tienes información suficiente o no estás seguro, di explícitamente "No tengo información sobre esto"
6. Al final de respuestas generales, agrega: "💡 Escribe 'hola' para volver al inicio"

NUNCA:
- Inventar precios o información
- Ser excesivamente largo
- Mencionar que eres una IA
- Dar respuestas vagas o inciertas sin admitir que no sabes`;

/**
 * Verifica si el mensaje del usuario está dentro del contexto de la clínica de belleza
 * Usa OpenAI para determinar si la pregunta es relevante
 */
async function checkIfInContext(userMessage: string): Promise<boolean> {
  // Si no hay OpenAI disponible, asumir que está en contexto para no bloquear
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-development') {
    return true;
  }

  try {
    const contextCheckPrompt = `Eres un filtro de contexto para una clínica de belleza.

Tu trabajo es determinar si el mensaje del usuario está relacionado con:
- Servicios de belleza (tratamientos faciales, corporales, depilación, etc.)
- Información de la clínica (horarios, ubicación, contacto, precios)
- Agendar citas o reservas
- Consultas sobre tratamientos de belleza

Responde SOLO con "SI" si el mensaje está relacionado con estos temas.
Responde SOLO con "NO" si el mensaje es sobre cualquier otro tema (clima, deportes, política, chistes, conversación general, etc.)

Mensaje del usuario: "${userMessage}"

Respuesta (SI o NO):`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un clasificador de contexto. Responde solo SI o NO.' },
        { role: 'user', content: contextCheckPrompt }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const response = completion.choices[0]?.message?.content?.trim().toUpperCase() || 'NO';
    
    logger.info('Context check result', {
      userMessage: userMessage.substring(0, 50),
      isInContext: response === 'SI',
      rawResponse: response
    });

    return response === 'SI';
  } catch (error) {
    logger.error('Error checking context:', error);
    // En caso de error, asumir que está en contexto para no bloquear
    return true;
  }
}

export async function handleFreeQuery(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): Promise<{ message: string; nextState: ChatState; metadata?: Record<string, any> }> {
  try {
    // PRIMERO: Verificar si el mensaje está dentro del contexto de la clínica
    const isInContext = await checkIfInContext(userMessage);
    
    if (!isInContext) {
      logger.info('Message is out of clinic context, escalating', {
        userMessage: userMessage.substring(0, 50)
      });

      return {
        message: 'Entiendo que necesitas ayuda específica. Te estoy conectando con un ejecutivo que podrá atenderte mejor. En un momento te responderá un miembro de nuestro equipo. 👨‍💼',
        nextState: ChatState.ESCALATION,
        metadata: {
          escalationReason: 'out_of_clinic_context',
          needsHumanEscalation: true,
          originalQuery: userMessage
        }
      };
    }

    const faqAnswer = await knowledgeBase.search(userMessage);

    if (faqAnswer) {
      logger.info('FAQ answer found, returning directly without OpenAI', {
        userMessage: userMessage.substring(0, 50)
      });

      return {
        message: faqAnswer + '\n\n💡 Escribe \'hola\' para volver al inicio',
        nextState: ChatState.FREE_QUERY,
        metadata: { fromFAQ: true }
      };
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-development') {
      return handleFallbackQuery(userMessage);
    }

    const services = serviceMatcher.getAllServices();
    const categories = serviceMatcher.getCategories();

    const servicesContext = generateServicesContext(services);
    const categoriesContext = generateCategoriesContext(categories);

    const messages: any = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: userMessage }
    ];

    messages.splice(1, 0, {
      role: 'system',
      content: servicesContext + '\n\n' + categoriesContext
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    let response = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

    // Detectar si la IA no sabe la respuesta
    const uncertaintyPhrases = [
      'no tengo información',
      'no puedo ayudarte',
      'no estoy seguro',
      'no sé',
      'no tengo esa información',
      'no dispongo',
      'no cuento con',
      'lamentablemente no',
      'desafortunadamente no'
    ];

    const responseNormalized = response.toLowerCase();
    const isUncertain = uncertaintyPhrases.some(phrase => responseNormalized.includes(phrase));

    // Si la IA no sabe la respuesta, escalar automáticamente
    if (isUncertain) {
      logger.info('AI is uncertain about the answer, escalating conversation', {
        userMessage: userMessage.substring(0, 50),
        aiResponse: response.substring(0, 100)
      });

      return {
        message: 'Entiendo tu consulta, pero prefiero que un ejecutivo especializado te responda para darte la información más precisa. En un momento te atenderá un miembro de nuestro equipo. 👨‍💼',
        nextState: ChatState.ESCALATION,
        metadata: {
          escalationReason: 'ai_uncertain',
          needsHumanEscalation: true,
          originalQuery: userMessage,
          aiResponse: response
        }
      };
    }

    const detectedService = serviceMatcher.fuzzyMatch(userMessage);
    let bookingLink: string | undefined;

    if (detectedService && isBookingIntent(userMessage)) {
      bookingLink = bookingLinkGenerator.generateFromService(detectedService);
      response = `¡Perfecto! Te ayudo a agendar ${detectedService.name}. 😊\n\n${bookingLink}\n\n¿Te ayuda con algo más?`;
    }

    logger.info('FreeQuery processed', {
      messageLength: userMessage.length,
      responseLength: response.length,
      hasService: !!detectedService,
      hasBookingLink: !!bookingLink
    });

    return {
      message: response,
      nextState: ChatState.FREE_QUERY,
      metadata: bookingLink ? { bookingLink, serviceId: detectedService?.id } : undefined
    };

  } catch (error: any) {
    logger.error('FreeQuery error:', error);
    return handleFallbackQuery(userMessage);
  }
}

function handleFallbackQuery(userMessage: string): {
  message: string;
  nextState: ChatState;
  metadata?: Record<string, any>;
} {
  const faqKeywords = [
    'horario', 'ubicación', 'dirección', 'contacto', 'teléfono',
    'pago', 'efectivo', 'tarjeta', 'cuánto tiempo',
    'cuántas sesiones', 'duele', 'efectos secundarios'
  ];

  const normalized = userMessage.toLowerCase();

  for (const keyword of faqKeywords) {
    if (normalized.includes(keyword)) {
      return {
        message: `Tengo información limitada en este momento. 

¿Te gustaría hablar con un agente o ver nuestros servicios?

1. Ver servicios
2. Hablar con un agente
3. Volver al inicio`,
        nextState: ChatState.FREE_QUERY
      };
    }
  }

  // Si no coincide con ninguna palabra clave conocida, escalar automáticamente
  logger.info('No FAQ match found, escalating conversation', {
    userMessage: userMessage.substring(0, 50)
  });

  return {
    message: 'Entiendo tu consulta, pero prefiero que un ejecutivo especializado te responda para darte la información más precisa. En un momento te atenderá un miembro de nuestro equipo. 👨‍💼',
    nextState: ChatState.ESCALATION,
    metadata: {
      escalationReason: 'no_faq_match',
      needsHumanEscalation: true,
      originalQuery: userMessage
    }
  };
}

function generateServicesContext(services: any[]): string {
  if (services.length === 0) return '';

  const context = 'SERVICIOS DISPONIBLES:\n\n';

  const serviceList = services.slice(0, 30).map(s =>
    `- ${s.name}: $${s.price?.toLocaleString('es-CL') || 'Consultar'} (${s.sessions || '?'} sesiones)`
  ).join('\n');

  return context + serviceList;
}

function generateCategoriesContext(categories: { name: string; count: number }[]): string {
  if (categories.length === 0) return '';

  return 'CATEGORÍAS: ' + categories.map(c => c.name).join(', ');
}

function isBookingIntent(message: string): boolean {
  const bookingWords = [
    'agendar', 'reservar', 'cita', 'hora', 'turno',
    'quiero ir', 'me quiero hacer', 'quiero tratamiento'
  ];

  const normalized = message.toLowerCase();
  return bookingWords.some(b => normalized.includes(b));
}
