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

TUS CAPACIDADES:
- Responder preguntas sobre servicios, productos, tecnologías e ingredientes
- Ayudar a agendar citas
- Proporcionar información sobre cuidados pre y post tratamiento
- Explicar políticas de la clínica

INSTRUCCIONES IMPORTANTES:
1. Si tienes información de la base de conocimientos, úsala como referencia principal
2. Si no estás seguro de algo, admítelo y ofrece contactar a un agente humano
3. Siempre sé cortés y profesional
4. Mantén las respuestas concisas pero informativas
5. Si detectas una situación compleja o delicada (alergias, reacciones, quejas), sugiere escalar a un humano

FORMATO DE RESPUESTA:
- Usa párrafos cortos
- Usa listas cuando sea apropiado
- Incluye emojis ocasionalmente para ser más amigable (pero no en exceso)
- Termina con una pregunta o llamado a la acción cuando sea apropiado`;

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
          content: `INFORMACIÓN DE LA BASE DE CONOCIMIENTOS:\n${knowledgeContext}\n\nUsa esta información para responder la pregunta del usuario de manera precisa.`,
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

      return {
        message: aiMessage,
        usedKnowledgeBase: !!knowledgeContext,
        confidence: this.calculateConfidence(completion, knowledgeContext),
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
    const escalationKeywords = [
      'alergia',
      'reacción',
      'problema',
      'queja',
      'dolor',
      'emergencia',
      'urgente',
      'mal',
      'error',
      'insatisfecho',
      'molesto',
      'enojado',
    ];

    const messageLower = userMessage.toLowerCase();
    const responseLower = aiResponse.toLowerCase();

    // Check if user message contains escalation keywords
    const hasEscalationKeyword = escalationKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    // Check if AI is uncertain
    const aiUncertain = responseLower.includes('no estoy seguro') ||
                       responseLower.includes('no puedo') ||
                       responseLower.includes('contactar') ||
                       responseLower.includes('agente humano');

    return hasEscalationKeyword || aiUncertain;
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
