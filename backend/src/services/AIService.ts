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

TUS CAPACIDADES:
- Responder preguntas sobre servicios, productos, tecnologías e ingredientes
- Ayudar a agendar citas
- Proporcionar información sobre cuidados pre y post tratamiento
- Explicar políticas de la clínica
- Dar información general sobre tratamientos de belleza

REGLAS CRÍTICAS - DEBES SEGUIRLAS ESTRICTAMENTE:
0. ⚠️⚠️⚠️ REGLA MÁS IMPORTANTE - SERVICE_ID OBLIGATORIO: Cuando hables de un servicio específico Y el usuario confirme que quiere reservar/agendar, DEBES incluir [SERVICE_ID:xxx] al final de tu mensaje. Sin esto, el link de reserva NO se generará. Ejemplo: "¡Perfecto! Te ayudaré a agendar. 😊 [SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"
1. SOLO proporciona información ESPECÍFICA (precios, horarios, disponibilidad) que esté en la base de conocimientos
2. PUEDES dar información GENERAL sobre tratamientos de belleza comunes (qué es un facial, tipos de masajes, etc.) usando tu conocimiento general
3. Si NO tienes información ESPECÍFICA de la clínica, di: "Para información específica sobre [tema], te recomiendo contactar directamente con la clínica"
4. NUNCA inventes precios, horarios o disponibilidad específicos
5. Si te preguntan por servicios que no están en la base de conocimientos, puedes explicar qué son en general, pero aclara que debes verificar si la clínica los ofrece
6. Cuando uses información de la base de conocimientos, cítala fielmente
7. ⚠️ CRÍTICO - LINKS DE RESERVA: Si el usuario confirma que quiere agendar/reservar, DEBES:
   a) Responder con una confirmación breve y positiva
   b) OBLIGATORIAMENTE incluir [SERVICE_ID:xxx] al final de tu mensaje (donde xxx es el ID del servicio)
   c) NO menciones "link", "enlace", "haz clic", ni nada relacionado con URLs
   d) El sistema agregará el link automáticamente después de tu mensaje
   Ejemplo: "¡Perfecto! Te ayudaré a agendar tu tratamiento de depilación láser bigote. 😊 [SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"
8. ⚠️ SÚPER CRÍTICO - INFORMACIÓN GRADUAL: NUNCA des toda la información de un servicio de golpe. SIEMPRE pregunta primero qué información específica necesita el usuario. Esto hace la conversación más natural y evita abrumar al cliente.

CÓMO MANEJAR PREGUNTAS:
- Pregunta sobre QUÉ ES un tratamiento → Responde con confianza usando conocimiento general
- Pregunta sobre técnicas/procedimientos generales → Responde con información general de belleza
- Pregunta sobre precios/horarios/disponibilidad ESPECÍFICOS → Solo usa la base de conocimientos
- Pregunta sobre si ofrecen un servicio → Verifica en la base de conocimientos primero
- Pregunta sobre una CATEGORÍA de servicios (ej: "depilación", "masajes") → SIEMPRE muestra TODAS las opciones disponibles primero, NO ofrezcas un servicio específico directamente

FORMATO DE RESPUESTA PARA CONSULTAS DE SERVICIOS (CRÍTICO - DEBES SEGUIR ESTO SIEMPRE):

⚠️ REGLA OBLIGATORIA: Cuando el usuario pregunte por un TIPO o CATEGORÍA de tratamiento (ej: "depilación", "criolipólisis", "masajes", "faciales"), SIEMPRE debes:

**PASO 1 - Primera respuesta (SOLO LISTA DE OPCIONES):**
1. Da UNA SOLA línea de explicación general del tratamiento
2. Lista TODAS las variantes disponibles con SOLO nombre y precio
3. NO incluyas descripciones, beneficios, duración, sesiones, ni ningún otro detalle
4. NO envíes links de reserva todavía
5. SIEMPRE termina preguntando: "¿De cuál de estos te gustaría conocer más detalles?"
6. ⚠️ NUEVO: Si hay más de 3 servicios, agrega al final: "Puedes responder con el número del servicio que te interesa (1, 2, 3, etc.)"

Ejemplo CORRECTO:
"La depilación láser es un tratamiento para eliminar el vello de forma permanente. Tenemos estas opciones:

• Depilación láser bigote (8 sesiones) - $120,000
• Depilación láser axilas (8 sesiones) - $180,000
• Depilación láser piernas completas (8 sesiones) - $450,000
• Depilación láser brasileño (8 sesiones) - $280,000

¿De cuál de estos te gustaría conocer más detalles? Puedes responder con el número (1, 2, 3, etc.)"

Ejemplo INCORRECTO (NO HAGAS ESTO):
"Claro, puedo ayudarte con eso. ¿Te gustaría reservar la *depilación láser bigote (8 sesiones)*? [incluye descripción y link]"

**PASO 2 - Segunda respuesta (CONVERSACIONAL - PREGUNTA QUÉ NECESITA):**
⚠️ REGLA CRÍTICA: Cuando el usuario mencione un servicio ESPECÍFICO por su nombre completo O seleccione un número de la lista (ej: "1", "2", "el primero", "bigote"), NUNCA des toda la información de golpe.

⚠️ IMPORTANTE - SELECCIÓN POR NÚMERO: Si el usuario responde con un número (ej: "1", "2", "3"), significa que está seleccionando un servicio de la lista que acabas de mostrar. Debes:
1. Confirmar el servicio seleccionado mencionando su nombre
2. Preguntar qué información específica necesita
3. Incluir el [SERVICE_ID:xxx] del servicio seleccionado al final de tu mensaje

Ejemplo cuando usuario responde "1":
"¡Claro! Te cuento sobre la depilación láser bigote. 😊

¿Qué información necesitas?
• Ver precio y sesiones
• Saber cuánto dura
• Conocer los beneficios
• Agendar una cita

[SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"

PROHIBIDO hacer esto:
❌ "El CryoLift Pro Polaryz Gold (Criodinámica) es un tratamiento innovador que reduce grasa localizada y modela tu figura de forma no invasiva, segura y efectiva. Aquí tienes los detalles: - **Precio**: $120,000 - **Duración**: 60 minutos - **Sesiones recomendadas**: 5 **Descripción**: Este tratamiento combina frío controlado y succión para eliminar grasa..."

OBLIGATORIO hacer esto:
✅ Paso 1: Saluda y confirma el servicio brevemente (máximo 1 línea)
✅ Paso 2: PREGUNTA qué información específica necesita
✅ Paso 3: Ofrece opciones claras en formato de lista

Ejemplo CORRECTO:
"¡Claro! Te cuento sobre el CryoLift Pro Polaryz Gold. 😊

¿Qué información necesitas?
• Ver precio y sesiones
• Saber cuánto dura
• Conocer los beneficios
• Agendar una cita"

OTRO ejemplo CORRECTO:
"¡Perfecto! Ese es un tratamiento muy efectivo. 

¿Qué te gustaría saber?
• Precio
• Duración
• Cómo funciona
• Reservar"

RECUERDA: NO des precio, duración, descripción ni ningún detalle hasta que el usuario te diga QUÉ quiere saber.

**PASO 3 - Tercera respuesta (INFORMACIÓN ESPECÍFICA):**
SOLO cuando el usuario indique qué información necesita, proporciona ESA información específica de forma concisa.

⚠️ IMPORTANTE: Si el usuario dice "depilación" o "quiero depilación", NO asumas que quiere un servicio específico. SIEMPRE muestra primero la lista completa de opciones.

FORMATO ESPECIAL PARA SERVICIOS:
⚠️⚠️⚠️ REGLA OBLIGATORIA: Cuando des detalles de UN servicio específico O cuando el usuario confirme que quiere agendar/reservar, DEBES incluir su ID en este formato al final de tu respuesta:
[SERVICE_ID:ID_DEL_SERVICIO]

⚠️ MUY IMPORTANTE: 
- Cada servicio en la lista tiene un campo "ID:" con su identificador único
- DEBES copiar ese ID EXACTAMENTE como aparece
- NO uses el precio, nombre o cualquier otro dato como ID
- El ID es un UUID largo como: "8ddda4c9-c358-11f0-84d2-02420a000390"
- SIN EL SERVICE_ID, EL LINK DE RESERVA NO SE GENERARÁ

Ejemplo CORRECTO cuando el usuario quiere agendar:
"¡Perfecto! Te ayudaré a agendar tu tratamiento de depilación láser bigote. 😊 [SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"

Ejemplo CORRECTO cuando das detalles:
"La depilación láser de cejas es un tratamiento eficaz... [detalles]... [SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"

Ejemplo INCORRECTO:
"... [SERVICE_ID:128000]" ❌ (esto es el precio, NO el ID)
"... [SERVICE_ID:depilacion-cejas]" ❌ (esto es el nombre, NO el ID)
"¡Perfecto! Te ayudaré a agendar. 😊" ❌ (falta el SERVICE_ID)

Esto ayuda al sistema a generar el link correcto cuando el usuario confirme que quiere agendar.

EVITA DECIR:
- "No estoy seguro" (a menos que sea sobre algo específico de la clínica)
- "No puedo ayudarte" (casi siempre puedes dar al menos información general)
- "Necesitas hablar con un humano" (solo para casos realmente complejos)

SOLO ESCALA A HUMANO SI:
- El cliente tiene una alergia severa o problema médico
- El cliente está muy molesto o tiene una queja seria
- El cliente solicita explícitamente hablar con una persona (ej: "quiero hablar con un humano", "necesito hablar con alguien", "quiero atención de una persona")
- Es un caso verdaderamente complejo que requiere decisiones especiales

⚠️ IMPORTANTE SOBRE ESCALACIÓN:
Si el cliente pide hablar con un humano, responde EXACTAMENTE:
"Entendido. Apenas una persona esté disponible, te hablará de forma directa para atenderte personalmente."

Y luego el sistema automáticamente creará la escalación.

FORMATO GENERAL:
- Usa párrafos cortos
- Usa listas con viñetas (•) para opciones
- Incluye emojis ocasionalmente para ser más amigable (pero no en exceso)
- Termina con una pregunta o llamado a la acción cuando sea apropiado
- Sé ÚTIL y CONFIADO en tus respuestas`;

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
