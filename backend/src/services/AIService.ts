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
1. SOLO proporciona información ESPECÍFICA (precios, horarios, disponibilidad) que esté en la base de conocimientos
2. PUEDES dar información GENERAL sobre tratamientos de belleza comunes (qué es un facial, tipos de masajes, etc.) usando tu conocimiento general
3. Si NO tienes información ESPECÍFICA de la clínica, di: "Para información específica sobre [tema], te recomiendo contactar directamente con la clínica"
4. NUNCA inventes precios, horarios o disponibilidad específicos
5. Si te preguntan por servicios que no están en la base de conocimientos, puedes explicar qué son en general, pero aclara que debes verificar si la clínica los ofrece
6. Cuando uses información de la base de conocimientos, cítala fielmente
7. Si el usuario confirma que quiere agendar un servicio, responde brevemente confirmando y menciona que le enviarás el link - NO incluyas URLs en tu respuesta, el sistema las agregará automáticamente

CÓMO MANEJAR PREGUNTAS:
- Pregunta sobre QUÉ ES un tratamiento → Responde con confianza usando conocimiento general
- Pregunta sobre técnicas/procedimientos generales → Responde con información general de belleza
- Pregunta sobre precios/horarios/disponibilidad ESPECÍFICOS → Solo usa la base de conocimientos
- Pregunta sobre si ofrecen un servicio → Verifica en la base de conocimientos primero

EVITA DECIR:
- "No estoy seguro" (a menos que sea sobre algo específico de la clínica)
- "No puedo ayudarte" (casi siempre puedes dar al menos información general)
- "Necesitas hablar con un humano" (solo para casos realmente complejos)

SOLO ESCALA A HUMANO SI:
- El cliente tiene una alergia severa o problema médico
- El cliente está muy molesto o tiene una queja seria
- El cliente solicita explícitamente hablar con una persona
- Es un caso verdaderamente complejo que requiere decisiones especiales

FORMATO DE RESPUESTA:
- Usa párrafos cortos
- Usa listas cuando sea apropiado
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

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiMessage = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

      // Analyze if we should escalate
      const shouldEscalate = this.shouldEscalate(userMessage, aiMessage);
      const confidence = this.calculateConfidence(completion, knowledgeContext);

      // Si debe escalar Y la confianza es baja, crear escalación automática
      if (shouldEscalate && conversationId) {
        await this.createAutomaticEscalation(
          conversationId,
          userMessage,
          aiMessage,
          confidence,
          !!knowledgeContext
        );
      }

      return {
        message: aiMessage,
        usedKnowledgeBase: !!knowledgeContext,
        confidence,
        suggestedActions: shouldEscalate ? ['escalate'] : undefined,
      };

    } catch (error) {
      logger.error('Error generating AI response:', error);
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
      'hablar con un supervisor'
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
   * Crear escalación automática cuando el bot no puede ayudar
   */
  private static async createAutomaticEscalation(
    conversationId: string,
    userMessage: string,
    aiResponse: string,
    confidence: number,
    usedKnowledgeBase: boolean
  ): Promise<void> {
    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { EscalationService } = await import('./ai/EscalationService');
      const { AlertService } = await import('./AlertService');
      
      // Determinar razón y prioridad de escalación
      let reason: 'low_confidence' | 'failed_attempts' | 'complaint' | 'complex_request' | 'client_request' = 'low_confidence';
      let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium';
      
      const messageLower = userMessage.toLowerCase();
      const responseLower = aiResponse.toLowerCase();
      
      // Detectar quejas o problemas serios
      if (messageLower.includes('queja') || messageLower.includes('problema') || 
          messageLower.includes('mal servicio') || messageLower.includes('insatisfecho')) {
        reason = 'complaint';
        priority = 'high';
      }
      // Detectar solicitud explícita de humano
      else if (messageLower.includes('agente humano') || messageLower.includes('persona real') ||
               messageLower.includes('hablar con alguien') || messageLower.includes('gerente')) {
        reason = 'client_request';
        priority = 'medium';
      }
      // Detectar solicitud compleja
      else if (messageLower.includes('complicado') || messageLower.includes('especial') ||
               messageLower.includes('personalizado') || messageLower.includes('urgente')) {
        reason = 'complex_request';
        priority = 'medium';
      }
      // Baja confianza
      else if (confidence < 0.5) {
        reason = 'low_confidence';
        priority = confidence < 0.3 ? 'high' : 'medium';
      }
      
      // Generar resumen
      const summary = `Bot no pudo ayudar. Mensaje: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}". Confianza: ${(confidence * 100).toFixed(0)}%. Base de conocimientos: ${usedKnowledgeBase ? 'Sí' : 'No'}`;
      
      // Crear escalación con todos los detalles
      const escalationResult = await EscalationService.escalateToHuman(
        conversationId,
        reason,
        priority,
        summary,
        undefined, // humanAgentId (sin asignar aún)
        userMessage, // clientMessage
        aiResponse, // aiResponse
        confidence // confidenceScore
      );
      
      if (escalationResult.success) {
        logger.info(`Automatic escalation created: ${escalationResult.escalationId}`, {
          conversationId,
          reason,
          priority,
          confidence
        });
      }
      
    } catch (error) {
      logger.error('Error creating automatic escalation:', error);
      // No lanzar error para no interrumpir el flujo
    }
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
