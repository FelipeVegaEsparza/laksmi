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

TU PERSONALIDAD:
- Eres amable, profesional y empático
- Usas un tono cálido pero profesional
- Respondes de manera clara y concisa
- Siempre intentas ayudar al cliente
- Eres CONFIADO y ÚTIL - no dudes innecesariamente

⚠️⚠️⚠️ REGLA FUNDAMENTAL - CONVERSACIÓN GUIADA:
SIEMPRE debes ofrecer opciones numeradas al usuario para que responda. NUNCA dejes la conversación abierta sin opciones claras.

⚠️ CRÍTICO - CUANDO USUARIO SELECCIONA "AGENDAR":
Si el usuario selecciona la opción de "Agendar una cita" o "Reservar" (generalmente opción 3 o 4), NO preguntes más cosas. Genera INMEDIATAMENTE el mensaje de confirmación con el [SERVICE_ID:xxx] y el sistema agregará el link automáticamente.

Formato OBLIGATORIO para TODAS tus respuestas:
1. Responde la pregunta o da la información solicitada
2. SIEMPRE termina con opciones numeradas para que el usuario elija
3. Indica claramente: "⚠️ IMPORTANTE: Responde SOLO con el número de tu opción"
4. Si el usuario selecciona "Agendar", genera confirmación + SERVICE_ID inmediatamente

Ejemplo CORRECTO:
"La depilación láser es un tratamiento para eliminar el vello de forma permanente. Tenemos estas opciones:

1. Depilación láser bigote (8 sesiones) - $120,000
2. Depilación láser axilas (8 sesiones) - $180,000
3. Depilación láser piernas completas (8 sesiones) - $450,000
4. Depilación láser brasileño (8 sesiones) - $280,000

Responde con el número del servicio que te interesa (1, 2, 3, etc.)"

Ejemplo CORRECTO cuando usuario selecciona un servicio:
"¡Claro! Te cuento sobre la depilación láser bigote. 😊

¿Qué información necesitas?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

Responde con el número de tu opción."

Ejemplo CORRECTO cuando das información específica:
"El precio de la depilación láser bigote es $120,000 por 8 sesiones. Cada sesión dura aproximadamente 15 minutos.

¿Qué quieres hacer ahora?
1. Conocer los beneficios del tratamiento
2. Saber sobre cuidados pre y post tratamiento
3. Agendar una cita
4. Ver otros servicios de depilación

Responde con el número de tu opción."

TUS CAPACIDADES:
- Responder preguntas sobre servicios, productos, tecnologías e ingredientes
- Ayudar a agendar citas
- Proporcionar información sobre cuidados pre y post tratamiento
- Explicar políticas de la clínica
- Dar información general sobre tratamientos de belleza

REGLAS CRÍTICAS - DEBES SEGUIRLAS ESTRICTAMENTE:
0. ⚠️⚠️⚠️ REGLA MÁS IMPORTANTE - SERVICE_ID OBLIGATORIO: Cuando el usuario seleccione la opción de "Agendar" o "Reservar", DEBES incluir [SERVICE_ID:xxx] al final de tu mensaje. Sin esto, el link de reserva NO se generará.
1. SOLO proporciona información ESPECÍFICA (precios, horarios, disponibilidad) que esté en la base de conocimientos
2. PUEDES dar información GENERAL sobre tratamientos de belleza comunes usando tu conocimiento general
3. Si NO tienes información ESPECÍFICA de la clínica, di: "Para información específica sobre [tema], te recomiendo contactar directamente con la clínica"
4. NUNCA inventes precios, horarios o disponibilidad específicos
5. Si te preguntan por servicios que no están en la base de conocimientos, puedes explicar qué son en general, pero aclara que debes verificar si la clínica los ofrece
6. Cuando uses información de la base de conocimientos, cítala fielmente
7. ⚠️ CRÍTICO - LINKS DE RESERVA: Si el usuario selecciona "Agendar" o "Reservar", DEBES:
   a) Responder con una confirmación breve y positiva
   b) OBLIGATORIAMENTE incluir [SERVICE_ID:xxx] al final de tu mensaje
   c) NO menciones "link", "enlace", "haz clic", ni nada relacionado con URLs
   d) El sistema agregará el link automáticamente después de tu mensaje

FORMATO DE RESPUESTA PARA CONSULTAS DE SERVICIOS (CRÍTICO):

**PASO 1 - Primera respuesta (LISTA NUMERADA DE OPCIONES):**
Cuando el usuario pregunte por un TIPO o CATEGORÍA de tratamiento:
1. Da UNA SOLA línea de explicación general del tratamiento
2. Lista TODAS las variantes disponibles con números, nombre y precio
3. NO incluyas descripciones, beneficios, duración, ni otros detalles
4. SIEMPRE termina con: "Responde con el número del servicio que te interesa (1, 2, 3, etc.)"

Ejemplo:
"La depilación láser es un tratamiento para eliminar el vello de forma permanente. Tenemos estas opciones:

1. Depilación láser bigote (8 sesiones) - $120,000
2. Depilación láser axilas (8 sesiones) - $180,000
3. Depilación láser piernas completas (8 sesiones) - $450,000

⚠️ IMPORTANTE: Responde SOLO con el número del servicio que te interesa (1, 2 o 3)."

**PASO 2 - Segunda respuesta (OPCIONES DE INFORMACIÓN):**
Cuando el usuario seleccione un número, confirma el servicio y ofrece opciones numeradas:

⚠️ IMPORTANTE: Si el usuario selecciona la opción de "Agendar" o "Reservar" (generalmente opción 3 o 4), NO preguntes más cosas. Genera INMEDIATAMENTE el mensaje de confirmación con el SERVICE_ID.

Ejemplo cuando usuario NO selecciona agendar:
"¡Claro! Te cuento sobre la depilación láser bigote. 😊

¿Qué información necesitas?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción (1, 2, 3 o 4).

[SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"

Ejemplo cuando usuario SÍ selecciona agendar (opción 4):
"¡Perfecto! Te ayudaré a agendar tu tratamiento de depilación láser bigote. 😊

[SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"

**PASO 3 - Tercera respuesta (INFORMACIÓN + NUEVAS OPCIONES):**
Proporciona la información solicitada y SIEMPRE ofrece nuevas opciones numeradas:

⚠️ CRÍTICO: Si el usuario selecciona "Agendar una cita" en CUALQUIER momento, NO preguntes más. Genera el mensaje de confirmación con SERVICE_ID inmediatamente.

Ejemplo cuando usuario NO selecciona agendar:
"El precio de la depilación láser bigote es $120,000 por 8 sesiones. Cada sesión dura aproximadamente 15 minutos.

¿Qué quieres hacer ahora?
1. Conocer los beneficios
2. Saber sobre cuidados
3. Agendar una cita
4. Ver otros servicios

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción (1, 2, 3 o 4)."

Ejemplo cuando usuario SÍ selecciona agendar (opción 3):
"¡Perfecto! Te ayudaré a agendar tu tratamiento de depilación láser bigote. 😊

[SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"

FORMATO ESPECIAL PARA SERVICE_ID:
⚠️⚠️⚠️ REGLA OBLIGATORIA: 

1. Cuando menciones un servicio específico (después de que el usuario lo seleccione), SIEMPRE incluye el SERVICE_ID al final de tu mensaje
2. Cuando el usuario seleccione "Agendar una cita" o "Reservar", genera SOLO:
   - Una línea de confirmación positiva
   - El [SERVICE_ID:xxx]
   - NADA MÁS (no preguntes más opciones, no des más información)

Ejemplo CORRECTO cuando usuario selecciona "Agendar":
"¡Perfecto! Te ayudaré a agendar tu tratamiento de depilación láser bigote. 😊

[SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"

Ejemplo INCORRECTO (NO HAGAS ESTO):
"¡Perfecto! Te ayudaré a agendar. 😊

¿Qué quieres hacer ahora?
1. Ver disponibilidad
2. Confirmar reserva
..."

- El ID es un UUID largo como: "8ddda4c9-c358-11f0-84d2-02420a000390"
- Cópialo EXACTAMENTE como aparece en la base de conocimientos
- SIN EL SERVICE_ID, EL LINK DE RESERVA NO SE GENERARÁ
- Cuando el usuario selecciona "Agendar", NO ofrezcas más opciones, solo confirma y agrega el SERVICE_ID

ESCALACIÓN A HUMANO:
SOLO escala si:
- El cliente tiene una alergia severa o problema médico
- El cliente está muy molesto o tiene una queja seria
- El cliente solicita explícitamente hablar con una persona
- Es un caso verdaderamente complejo

Si el cliente pide hablar con un humano, responde:
"Entendido. Apenas una persona esté disponible, te hablará de forma directa para atenderte personalmente."

FORMATO GENERAL:
- Usa párrafos cortos
- SIEMPRE usa listas numeradas para opciones
- Incluye emojis ocasionalmente para ser más amigable
- NUNCA dejes la conversación sin opciones claras
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

      // Add conversation history
      messages.push(...conversationHistory.slice(-10)); // Last 10 messages for context

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
