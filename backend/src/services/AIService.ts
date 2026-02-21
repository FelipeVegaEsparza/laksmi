import OpenAI from 'openai';
import { KnowledgeService } from './KnowledgeService';
import logger from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
});

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  message: string;
  usedKnowledgeBase: boolean;
  confidence: number;
  suggestedActions?: string[];
}

export class AIService {
  private static systemPrompt = `Eres un asistente virtual de una clínica de belleza profesional y amigable.

TU MISIÓN PRINCIPAL: Llevar al cliente a AGENDAR UNA CITA de forma natural y eficiente.

⚠️⚠️⚠️ REGLA CRÍTICA - SIEMPRE LISTAR SERVICIOS ESPECÍFICOS:
Cuando el usuario pregunte por una categoría (depilación, facial, corporal, etc.), DEBES:
1. Listar servicios ESPECÍFICOS con precios (NO categorías generales)
2. Usar formato numerado: "1. Nombre del servicio (X sesiones) - $precio"
3. Máximo 6 servicios por mensaje
4. Terminar con: "⚠️ IMPORTANTE: Responde SOLO con el número del servicio que te interesa"

EJEMPLO CORRECTO cuando usuario pregunta por depilación:
"La depilación láser es un tratamiento para eliminar el vello de forma permanente. Aquí tienes algunas opciones:

1. *Depilación láser bigote (8 sesiones)* - $120,000
2. *Depilación láser axilas (8 sesiones)* - $180,000
3. *Depilación láser piernas completas (8 sesiones)* - $450,000
4. *Depilación láser brasileño (8 sesiones)* - $280,000

⚠️ IMPORTANTE: Responde SOLO con el número del servicio que te interesa (1, 2, 3 o 4)."

EJEMPLO INCORRECTO (NO HACER):
"¿Te gustaría saber más sobre nuestros servicios?
1. Depilación
2. Tratamientos faciales
3. Tratamientos corporales
4. Agendar una cita"

⚠️⚠️⚠️ REGLA CRÍTICA - SERVICE_ID OBLIGATORIO:
En la base de conocimientos, cada servicio tiene un campo "ID:" con un UUID largo.

Cuando el usuario quiera agendar (diga "agendar", "reservar", "cita", o seleccione esa opción), DEBES:
1. Confirmar brevemente: "¡Perfecto! Te ayudaré a agendar tu tratamiento de [NOMBRE DEL SERVICIO]. 😊"
2. En una NUEVA LÍNEA, incluir EXACTAMENTE: [SERVICE_ID:xxx-xxx-xxx]
3. NO agregues más texto después del SERVICE_ID

FORMATO OBLIGATORIO para TODAS tus respuestas (EXCEPTO cuando usuario quiere agendar):
1. Responde la pregunta o da la información
2. SIEMPRE termina con opciones numeradas
3. Indica: "⚠️ IMPORTANTE: Responde SOLO con el número de tu opción"

REGLAS CRÍTICAS:
1. NUNCA listes categorías generales, SIEMPRE servicios específicos con precios
2. Usa el formato: "1. *Nombre (sesiones)* - $precio"
3. Lee TODA la conversación para saber de qué servicio habla el cliente
4. SIEMPRE incluye [SERVICE_ID:xxx] cuando el usuario quiere agendar
5. El SERVICE_ID es un UUID largo (36 caracteres con guiones)
6. Cópialo EXACTAMENTE de la base de conocimientos (campo "ID:")
7. SOLO proporciona información ESPECÍFICA que esté en la base de conocimientos
8. NUNCA inventes precios, horarios o disponibilidad

ESCALACIÓN A HUMANO:
SOLO escala si:
- Alergia severa o problema médico
- Cliente muy molesto o queja seria
- Cliente solicita explícitamente hablar con una persona

FORMATO GENERAL:
- Párrafos cortos
- SIEMPRE listas numeradas con servicios específicos y precios
- Emojis ocasionales
- NUNCA dejes conversación sin opciones claras
- SIEMPRE termina con "Responde con el número de tu opción"`;

  /**
   * Generate AI response with knowledge base integration
   */
  static async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    conversationId?: string
  ): Promise<AIResponse> {
    try {
      // Check if OpenAI is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-development') {
        logger.warn('OpenAI API key not configured, using fallback response');
        return this.getFallbackResponse(userMessage);
      }

      // Search knowledge base for relevant information
      const knowledgeContext = await KnowledgeService.getContextForAI(userMessage, conversationId);
      
      // Build messages array
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this.systemPrompt,
        },
      ];

      // Add knowledge base context if available
      if (knowledgeContext) {
        messages.push({
          role: 'system',
          content: `${knowledgeContext}\n\nIMPORTANTE: Usa ÚNICAMENTE la información proporcionada arriba para responder. Si la información que necesitas está en la lista de servicios, úsala directamente. NO inventes precios ni servicios que no estén listados.`,
        });
      }

      // Add conversation history - TODA LA CONVERSACIÓN para que la IA tenga contexto completo
      // Limitar a últimos 20 mensajes para no exceder límites de tokens
      messages.push(...conversationHistory.slice(-20));

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Log context size for debugging
      const contextSize = JSON.stringify(messages).length;
      logger.info('Calling OpenAI API', {
        model: 'gpt-4o-mini',
        messageCount: messages.length,
        contextSize,
        conversationId
      });

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Modelo más rápido, económico y estable
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 800, // Aumentado para respuestas más completas
      });

      const aiMessage = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
      
      logger.info('OpenAI response received', {
        conversationId,
        responseLength: aiMessage.length,
        finishReason: completion.choices[0]?.finish_reason
      });

      // Analyze if we should escalate
      const shouldEscalate = this.shouldEscalate(userMessage, aiMessage);
      const confidence = this.calculateConfidence(completion, knowledgeContext);

      return {
        message: aiMessage,
        usedKnowledgeBase: !!knowledgeContext,
        confidence,
        suggestedActions: shouldEscalate ? ['escalate'] : undefined,
      };

    } catch (error: any) {
      logger.error('Error generating AI response:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        type: error.type,
        conversationId
      });
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Determine if conversation should be escalated to human
   */
  private static shouldEscalate(userMessage: string, aiResponse: string): boolean {
    // Solo palabras clave de EMERGENCIA REAL, no palabras comunes
    const escalationKeywords = [
      'alergia severa',
      'reacción alérgica',
      'dolor intenso',
      'emergencia',
      'sangrado',
      'no puedo respirar',
      'muy molesto',
      'muy enojado',
      'quiero una queja formal',
      'hablar con el gerente',
      'hablar con un supervisor',
      'quiero hablar con un humano',
      'quiero hablar con una persona',
      'necesito hablar con alguien',
      'hablar con alguien',
      'agente humano',
      'persona real',
      'atención humana',
      'operador',
      'representante'
      // REMOVIDO: 'problema', 'mal', 'error', 'queja' (muy comunes)
    ];

    const messageLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();

    // Check if user message contains REAL escalation keywords
    const hasEscalationKeyword = escalationKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    // Check if AI explicitly cannot help (no solo "no estoy seguro")
    const aiCannotHelp = responseLower.includes('no puedo ayudarte con esto') ||
                        responseLower.includes('necesitas contactar urgentemente') ||
                        responseLower.includes('requiere atención médica');
    // REMOVIDO: 'no estoy seguro', 'no puedo', 'contactar', 'agente humano'
    // Estas frases son muy comunes y no indican necesidad de escalación

    return hasEscalationKeyword || aiCannotHelp;
  }

  /**
   * Calculate confidence score based on response quality
   */
  private static calculateConfidence(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    knowledgeContext: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if we used knowledge base
    if (knowledgeContext) {
      confidence += 0.3;
    }

    // Increase confidence based on finish reason
    if (completion.choices[0]?.finish_reason === 'stop') {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Fallback response when AI is not available
   */
  private static getFallbackResponse(userMessage: string): AIResponse {
    // Try to get answer from knowledge base directly
    return {
      message: 'Gracias por tu mensaje. Un agente humano te atenderá pronto para ayudarte con tu consulta. 😊',
      usedKnowledgeBase: false,
      confidence: 0.3,
      suggestedActions: ['escalate'],
    };
  }

  /**
   * Analyze user intent
   */
  static async analyzeIntent(message: string): Promise<{
    intent: string;
    entities: Record<string, any>;
    confidence: number;
  }> {
    // Simple intent detection
    const messageLower = message.toLowerCase();

    // Booking intent
    if (messageLower.includes('agendar') || messageLower.includes('cita') || messageLower.includes('reservar')) {
      return {
        intent: 'booking',
        entities: {},
        confidence: 0.8,
      };
    }

    // Service inquiry
    if (messageLower.includes('servicio') || messageLower.includes('tratamiento') || messageLower.includes('precio')) {
      return {
        intent: 'service_inquiry',
        entities: {},
        confidence: 0.8,
      };
    }

    // Product inquiry
    if (messageLower.includes('producto') || messageLower.includes('ingrediente')) {
      return {
        intent: 'product_inquiry',
        entities: {},
        confidence: 0.8,
      };
    }

    // General inquiry
    return {
      intent: 'general_inquiry',
      entities: {},
      confidence: 0.5,
    };
  }

  /**
   * Generate summary of conversation
   */
  static async generateConversationSummary(messages: ChatMessage[]): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-development') {
        return 'Resumen no disponible';
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Resume la siguiente conversación en 2-3 oraciones, destacando los puntos clave y el resultado.',
          },
          {
            role: 'user',
            content: JSON.stringify(messages),
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
      });

      return completion.choices[0]?.message?.content || 'Resumen no disponible';
    } catch (error) {
      logger.error('Error generating conversation summary:', error);
      return 'Resumen no disponible';
    }
  }
}
