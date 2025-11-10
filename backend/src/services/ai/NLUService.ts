import { IntentClassificationResult, Intent, Entity, EntityType, ConversationContext, NLUConfig } from '../../types/ai';
import logger from '../../utils/logger';

export class NLUService {
  private static config: NLUConfig = {
    confidenceThreshold: 0.7,
    fallbackIntent: 'unknown',
    supportedLanguages: ['es'],
    entityExtractionEnabled: true
  };

  // Patrones de intenciones predefinidos
  private static intentPatterns: Record<string, RegExp[]> = {
    greeting: [
      /^(hola|buenos días|buenas tardes|buenas noches|hey|hi)/i,
      /^(saludos|qué tal|cómo está)/i
    ],
    booking_request: [
      /quiero (reservar|agendar|pedir) (una )?cita/i,
      /necesito (una )?cita/i,
      /puedo (reservar|agendar)/i,
      /(reserva|agenda|cita)/i
    ],
    service_inquiry: [
      /qué servicios (tienen|ofrecen)/i,
      /(cuáles son|dime) (los )?servicios/i,
      /información sobre servicios/i,
      /(precios?|costos?|tarifas?)/i
    ],
    availability_check: [
      /disponibilidad/i,
      /cuándo (pueden|está disponible)/i,
      /horarios? (disponibles?|libres?)/i,
      /qué días (tienen|hay)/i
    ],
    cancel_booking: [
      /cancelar (mi )?cita/i,
      /quiero cancelar/i,
      /no puedo (ir|asistir)/i
    ],
    reschedule_booking: [
      /cambiar (mi )?cita/i,
      /reprogramar/i,
      /mover (la )?cita/i
    ],
    price_inquiry: [
      /cuánto cuesta/i,
      /(precio|costo|tarifa)/i,
      /qué vale/i
    ],
    location_inquiry: [
      /dónde (están|se encuentran)/i,
      /(dirección|ubicación)/i,
      /cómo llego/i
    ],
    complaint: [
      /queja/i,
      /problema/i,
      /mal servicio/i,
      /no estoy satisfech/i
    ],
    goodbye: [
      /^(adiós|hasta luego|nos vemos|chao|bye)/i,
      /gracias.*adiós/i
    ],
    affirmative: [
      /^(sí|si|claro|por supuesto|perfecto|ok|vale|de acuerdo)/i,
      /^(correcto|exacto|así es)/i
    ],
    negative: [
      /^(no|nada|para nada|de ninguna manera)/i,
      /^(no gracias|no quiero)/i
    ]
  };

  // Patrones de entidades
  private static entityPatterns: Record<string, RegExp[]> = {
    date: [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // DD/MM/YYYY
      /(hoy|mañana|pasado mañana)/gi,
      /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/gi,
      /(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi
    ],
    time: [
      /(\d{1,2}):(\d{2})/g, // HH:MM
      /(\d{1,2}) (de la mañana|de la tarde|de la noche)/gi,
      /(mañana|tarde|noche)/gi
    ],
    phone_number: [
      /(\+34|0034)?[\s\-]?[6789]\d{8}/g, // Teléfonos españoles
      /(\+\d{1,3})?[\s\-]?\d{9,15}/g // Formato internacional general
    ],
    email: [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    ],
    service_name: [
      /(limpieza facial|facial|masaje|manicura|pedicura|depilación|tratamiento)/gi,
      /(anti[- ]?edad|hidratación|exfoliación|peeling)/gi,
      /(spa|relajante|corporal)/gi
    ]
  };

  /**
   * Procesar mensaje y extraer intención y entidades
   */
  static async processMessage(message: string, context?: ConversationContext): Promise<IntentClassificationResult> {
    try {
      const normalizedMessage = this.normalizeMessage(message);
      
      // Clasificar intención
      const intent = this.classifyIntent(normalizedMessage, context);
      
      // Extraer entidades si está habilitado
      const entities = this.config.entityExtractionEnabled 
        ? this.extractEntities(normalizedMessage)
        : [];

      // Determinar si necesita escalación humana
      const needsHumanEscalation = this.shouldEscalateToHuman(intent, entities, context);

      // Generar respuesta sugerida si la confianza es baja
      const suggestedResponse = intent.confidence < this.config.confidenceThreshold
        ? this.generateFallbackResponse(normalizedMessage)
        : undefined;

      return {
        intent,
        entities,
        confidence: intent.confidence,
        needsHumanEscalation,
        suggestedResponse
      };

    } catch (error) {
      logger.error('NLU processing error:', error);
      
      return {
        intent: { name: this.config.fallbackIntent, confidence: 0, entities: [] },
        entities: [],
        confidence: 0,
        needsHumanEscalation: true,
        suggestedResponse: 'Lo siento, no he entendido tu mensaje. ¿Podrías reformularlo?'
      };
    }
  }

  /**
   * Clasificar intención del mensaje
   */
  private static classifyIntent(message: string, context?: ConversationContext): Intent {
    let bestMatch = { name: this.config.fallbackIntent, confidence: 0 };

    // Verificar cada patrón de intención
    for (const [intentName, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          const confidence = this.calculateIntentConfidence(message, pattern, context);
          
          if (confidence > bestMatch.confidence) {
            bestMatch = { name: intentName, confidence };
          }
        }
      }
    }

    // Ajustar confianza basado en contexto
    if (context) {
      bestMatch.confidence = this.adjustConfidenceWithContext(bestMatch, context);
    }

    return {
      name: bestMatch.name,
      confidence: bestMatch.confidence,
      entities: []
    };
  }

  /**
   * Extraer entidades del mensaje
   */
  private static extractEntities(message: string): Entity[] {
    const entities: Entity[] = [];

    for (const [entityType, patterns] of Object.entries(this.entityPatterns)) {
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(message)) !== null) {
          entities.push({
            type: entityType as EntityType,
            value: match[0],
            confidence: 0.9,
            start: match.index,
            end: match.index + match[0].length
          });
        }
      }
    }

    return entities;
  }

  /**
   * Calcular confianza de la intención
   */
  private static calculateIntentConfidence(message: string, pattern: RegExp, context?: ConversationContext): number {
    let confidence = 0.8; // Confianza base

    // Ajustar por longitud del match
    const match = message.match(pattern);
    if (match) {
      const matchRatio = match[0].length / message.length;
      confidence += matchRatio * 0.2;
    }

    // Ajustar por contexto
    if (context?.currentIntent) {
      // Bonus si es coherente con la intención actual
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Ajustar confianza basado en contexto de conversación
   */
  private static adjustConfidenceWithContext(intent: { name: string; confidence: number }, context: ConversationContext): number {
    let adjustedConfidence = intent.confidence;

    // Si estamos en un flujo específico, dar más peso a intenciones relacionadas
    if (context.currentFlow === 'booking' && intent.name.includes('booking')) {
      adjustedConfidence += 0.1;
    }

    // Si hay una reserva pendiente, dar peso a intenciones de confirmación/cancelación
    if (context.pendingBooking) {
      if (['affirmative', 'negative', 'cancel_booking'].includes(intent.name)) {
        adjustedConfidence += 0.15;
      }
    }

    return Math.min(adjustedConfidence, 1.0);
  }

  /**
   * Determinar si debe escalarse a humano
   */
  private static shouldEscalateToHuman(intent: Intent, entities: Entity[], context?: ConversationContext): boolean {
    // Escalación por baja confianza
    if (intent.confidence < this.config.confidenceThreshold) {
      return true;
    }

    // Escalación por tipo de intención
    if (['complaint', 'complex_request'].includes(intent.name)) {
      return true;
    }

    // Escalación por múltiples intentos fallidos
    if (context?.variables.failedAttempts && context.variables.failedAttempts >= 3) {
      return true;
    }

    return false;
  }

  /**
   * Generar respuesta de fallback
   */
  private static generateFallbackResponse(message: string): string {
    const fallbackResponses = [
      'No estoy seguro de haber entendido. ¿Podrías ser más específico?',
      'Disculpa, ¿podrías reformular tu pregunta?',
      'No he comprendido completamente. ¿En qué puedo ayudarte exactamente?',
      'Perdón, no he entendido bien. ¿Quieres reservar una cita, consultar servicios o algo más?'
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  /**
   * Normalizar mensaje para procesamiento
   */
  private static normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\sáéíóúñü]/g, ' ') // Remover puntuación excepto acentos
      .replace(/\s+/g, ' '); // Normalizar espacios
  }

  /**
   * Agregar nuevo patrón de intención
   */
  static addIntentPattern(intentName: string, pattern: RegExp): void {
    if (!this.intentPatterns[intentName]) {
      this.intentPatterns[intentName] = [];
    }
    this.intentPatterns[intentName].push(pattern);
    logger.info(`Added new pattern for intent: ${intentName}`);
  }

  /**
   * Agregar nuevo patrón de entidad
   */
  static addEntityPattern(entityType: EntityType, pattern: RegExp): void {
    if (!this.entityPatterns[entityType]) {
      this.entityPatterns[entityType] = [];
    }
    this.entityPatterns[entityType].push(pattern);
    logger.info(`Added new pattern for entity: ${entityType}`);
  }

  /**
   * Obtener configuración actual
   */
  static getConfig(): NLUConfig {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(newConfig: Partial<NLUConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('NLU configuration updated:', this.config);
  }

  /**
   * Obtener estadísticas del NLU
   */
  static getStats(): {
    intentPatterns: number;
    entityPatterns: number;
    config: NLUConfig;
  } {
    const intentCount = Object.values(this.intentPatterns).reduce((sum, patterns) => sum + patterns.length, 0);
    const entityCount = Object.values(this.entityPatterns).reduce((sum, patterns) => sum + patterns.length, 0);

    return {
      intentPatterns: intentCount,
      entityPatterns: entityCount,
      config: this.getConfig()
    };
  }

  /**
   * Entrenar con nuevos ejemplos (simulado)
   */
  static trainWithExample(message: string, expectedIntent: string, expectedEntities: Entity[]): void {
    // En una implementación real, esto actualizaría el modelo
    logger.info(`Training example received: "${message}" -> ${expectedIntent}`, expectedEntities);
    
    // Por ahora, solo registramos para análisis futuro
    // TODO: Implementar entrenamiento real del modelo
  }
}