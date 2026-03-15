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
5. Si no tienes información, sé honesto y ofrece alternativas
6. Al final de respuestas generales, agrega: "💡 Escribe 'hola' para volver al inicio"

NUNCA:
- Inventar precios o información
- Ser excesivamente largo
- Mencionar que eres una IA`;

export async function handleFreeQuery(
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): Promise<{ message: string; nextState: ChatState; metadata?: Record<string, any> }> {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-development') {
      return handleFallbackQuery(userMessage);
    }

    const faqAnswer = await knowledgeBase.search(userMessage);

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

    if (faqAnswer) {
      messages.splice(1, 0, {
        role: 'system',
        content: `PREGUNTAS FRECUENTES:\n${faqAnswer}`
      });
    }

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

  return {
    message: 'Gracias por tu mensaje. ¿Hay algo específico en lo que pueda ayudarte?\n\n1. Ver servicios\n2. Agendar cita\n3. Hablar con un agente',
    nextState: ChatState.FREE_QUERY
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
