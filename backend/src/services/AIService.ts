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
7. ⚠️ CRÍTICO - LINKS DE RESERVA: Si el usuario confirma que quiere agendar/reservar, responde SOLO con una confirmación breve y positiva. NO menciones "link", "enlace", "haz clic", ni nada relacionado con URLs. El sistema agregará el link automáticamente después de tu mensaje. Ejemplo: "¡Perfecto! Te ayudaré a agendar tu tratamiento de [nombre del servicio]. 😊"
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

Ejemplo CORRECTO:
"La depilación láser es un tratamiento para eliminar el vello de forma permanente. Tenemos estas opciones:

• Depilación láser bigote (8 sesiones) - $120,000
• Depilación láser axilas (8 sesiones) - $180,000
• Depilación láser piernas completas (8 sesiones) - $450,000
• Depilación láser brasileño (8 sesiones) - $280,000

¿De cuál de estos te gustaría conocer más detalles?"

Ejemplo INCORRECTO (NO HAGAS ESTO):
"Claro, puedo ayudarte con eso. ¿Te gustaría reservar la *depilación láser bigote (8 sesiones)*? [incluye descripción y link]"

**PASO 2 - Segunda respuesta (CONVERSACIONAL - PREGUNTA QUÉ NECESITA):**
⚠️ REGLA CRÍTICA: Cuando el usuario mencione un servicio ESPECÍFICO por su nombre completo (ej: "CryoLift Pro Polaryz Gold (Criodinámica) 1 Zona 5 Sesiones"), NUNCA des toda la información de golpe.

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
Cuando des detalles de UN servicio específico, DEBES incluir su ID en este formato al final de tu respuesta:
[SERVICE_ID:ID_DEL_SERVICIO]

⚠️ MUY IMPORTANTE: 
- Cada servicio en la lista tiene un campo "ID:" con su identificador único
- DEBES copiar ese ID EXACTAMENTE como aparece
- NO uses el precio, nombre o cualquier otro dato como ID
- El ID es un UUID largo como: "8ddda4c9-c358-11f0-84d2-02420a000390"

Ejemplo CORRECTO:
"La depilación láser de cejas es un tratamiento eficaz... [detalles]... [SERVICE_ID:8ddda4c9-c358-11f0-84d2-02420a000390]"

Ejemplo INCORRECTO:
"... [SERVICE_ID:128000]" ❌ (esto es el precio, NO el ID)
"... [SERVICE_ID:depilacion-cejas]" ❌ (esto es el nombre, NO el ID)

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

      logger.info('🔔 Evaluación de escalación:', {
        conversationId,
        shouldEscalate,
        confidence,
        userMessagePreview: userMessage.substring(0, 100),
        aiMessagePreview: aiMessage.substring(0, 100)
      });

      // Si debe escalar Y la confianza es baja, crear escalación automática
      let finalMessage = aiMessage;
      if (shouldEscalate && conversationId) {
        logger.info('🔔 shouldEscalate es TRUE, llamando a createAutomaticEscalation...', {
          conversationId,
          shouldEscalate,
          confidence
        });
        
        const escalationMessage = await this.createAutomaticEscalation(
          conversationId,
          userMessage,
          aiMessage,
          confidence,
          !!knowledgeContext
        );
        
        logger.info('🔔 createAutomaticEscalation retornó:', {
          hasEscalationMessage: !!escalationMessage,
          messageLength: escalationMessage?.length
        });
        
        // Si se generó un mensaje de escalación, usarlo
        if (escalationMessage) {
          finalMessage = escalationMessage;
          logger.info('🔔 Mensaje final reemplazado con mensaje de escalación');
        }
      }

      return {
        message: finalMessage,
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
   * Crear escalación automática cuando el bot no puede ayudar
   * @returns El mensaje de escalación con link de WhatsApp, o undefined si no se pudo generar
   */
  private static async createAutomaticEscalation(
    conversationId: string,
    userMessage: string,
    aiResponse: string,
    confidence: number,
    usedKnowledgeBase: boolean
  ): Promise<string | undefined> {
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
               messageLower.includes('hablar con alguien') || messageLower.includes('gerente') ||
               messageLower.includes('hablar con un humano') || messageLower.includes('hablar con una persona') ||
               messageLower.includes('quiero hablar con') || messageLower.includes('necesito hablar con') ||
               messageLower.includes('contactar con') || messageLower.includes('atención humana') ||
               messageLower.includes('operador') || messageLower.includes('representante')) {
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
        
        // Generar mensaje de escalación con link de WhatsApp
        try {
          logger.info('🔍 Generando mensaje de escalación con WhatsApp...', { reason });
          
          // Obtener número de WhatsApp de la configuración
          let whatsappLink = '';
          try {
            const { CompanySettingsModel } = await import('../models/CompanySettings');
            const settings = await CompanySettingsModel.getSettings();
            
            logger.info('📋 Configuración obtenida en AIService:', {
              hasSettings: !!settings,
              contactWhatsapp: settings?.contactWhatsapp
            });
            
            if (settings?.contactWhatsapp) {
              const cleanNumber = settings.contactWhatsapp.replace(/[^\d+]/g, '');
              const message = encodeURIComponent('Hola, vengo desde el sitio web. Necesito hablar con un humano');
              whatsappLink = `\n\n📱 También puedes contactarnos directamente por WhatsApp:\n${`https://wa.me/${cleanNumber}?text=${message}`}`;
              
              logger.info('✅ Link de WhatsApp generado en AIService:', {
                cleanNumber,
                linkLength: whatsappLink.length
              });
            } else {
              logger.warn('⚠️ No hay número de WhatsApp configurado');
            }
          } catch (settingsError) {
            logger.error('❌ Error obteniendo configuración de WhatsApp:', settingsError);
          }
          
          // Generar mensaje base según la razón
          let baseMessage = '';
          if (reason === 'complaint') {
            baseMessage = 'Entiendo tu preocupación y quiero asegurarme de que recibas la mejor atención. Te voy a conectar con uno de nuestros especialistas que podrá ayudarte mejor. Un momento por favor...';
          } else if (reason === 'client_request') {
            baseMessage = 'Entendido. Apenas una persona esté disponible, te hablará de forma directa para atenderte personalmente.';
          } else if (reason === 'complex_request') {
            baseMessage = 'Tu consulta requiere atención especializada. Te voy a transferir con uno de nuestros expertos que podrá darte una respuesta más detallada.';
          } else if (reason === 'low_confidence') {
            baseMessage = 'Veo que hemos tenido algunas dificultades para entendernos. Permíteme conectarte con un agente humano que podrá asistirte de manera más personalizada.';
          } else {
            baseMessage = 'Te voy a conectar con uno de nuestros especialistas para brindarte la mejor atención posible. Un momento por favor...';
          }
          
          // Combinar mensaje base con link de WhatsApp
          const escalationMessage = baseMessage + whatsappLink;
          
          logger.info('✅ Mensaje de escalación con WhatsApp generado y aplicado', {
            conversationId,
            reason,
            hasWhatsappLink: whatsappLink.length > 0,
            messageLength: escalationMessage.length,
            finalMessage: escalationMessage.substring(0, 200)
          });
          
          // Retornar el mensaje de escalación
          return escalationMessage;
        } catch (msgError) {
          logger.error('❌ Error generando mensaje de escalación con WhatsApp:', msgError);
          return undefined;
        }
      }
      
      return undefined;
      
    } catch (error) {
      logger.error('Error creating automatic escalation:', error);
      // No lanzar error para no interrumpir el flujo
      return undefined;
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
