import { ConversationContext, Message, IntentClassificationResult, EscalationReason, EscalationPriority } from '../../types/ai';
import { ConversationModel } from '../../models/Conversation';
import { ClientModel } from '../../models/Client';
import logger from '../../utils/logger';

export interface ComplexityAnalysis {
  isComplex: boolean;
  complexityScore: number;
  reasons: string[];
  priority: EscalationPriority;
  recommendedActions: string[];
  confidence: number;
}

export class ComplexCaseDetector {
  private static readonly COMPLEXITY_THRESHOLD = 8;  // Aumentado de 5 a 8 para reducir falsos positivos
  private static readonly HIGH_COMPLEXITY_THRESHOLD = 12;  // Aumentado de 8 a 12

  /**
   * Analizar la complejidad de un caso basado en múltiples factores
   */
  static async analyzeCase(
    conversationId: string,
    message: string,
    nluResult: IntentClassificationResult,
    context: ConversationContext,
    clientId: string
  ): Promise<ComplexityAnalysis> {
    try {
      let complexityScore = 0;
      const reasons: string[] = [];
      const recommendedActions: string[] = [];

      // 1. Análisis del contenido del mensaje
      const contentAnalysis = this.analyzeMessageContent(message);
      complexityScore += contentAnalysis.score;
      reasons.push(...contentAnalysis.reasons);

      // 2. Análisis del historial de conversación
      const conversationAnalysis = await this.analyzeConversationHistory(conversationId, context);
      complexityScore += conversationAnalysis.score;
      reasons.push(...conversationAnalysis.reasons);

      // 3. Análisis del comportamiento del cliente
      const clientAnalysis = await this.analyzeClientBehavior(clientId, context);
      complexityScore += clientAnalysis.score;
      reasons.push(...clientAnalysis.reasons);

      // 4. Análisis de la intención y confianza
      const intentAnalysis = this.analyzeIntentComplexity(nluResult);
      complexityScore += intentAnalysis.score;
      reasons.push(...intentAnalysis.reasons);

      // 5. Análisis temporal y de urgencia
      const temporalAnalysis = this.analyzeTemporalFactors(message, context);
      complexityScore += temporalAnalysis.score;
      reasons.push(...temporalAnalysis.reasons);

      // Determinar prioridad basada en el score
      let priority: EscalationPriority = 'low';
      if (complexityScore >= this.HIGH_COMPLEXITY_THRESHOLD) {
        priority = 'high';
      } else if (complexityScore >= this.COMPLEXITY_THRESHOLD) {
        priority = 'medium';
      }

      // Casos especiales que requieren prioridad urgente
      if (this.detectUrgentKeywords(message) || this.detectEmergencyPatterns(message)) {
        priority = 'urgent';
        complexityScore = Math.max(complexityScore, 10);
        reasons.push('Palabras clave de emergencia detectadas');
      }

      // Generar acciones recomendadas
      recommendedActions.push(...this.generateRecommendedActions(complexityScore, reasons, priority));

      // Calcular confianza del análisis
      const confidence = this.calculateAnalysisConfidence(complexityScore, reasons.length);

      return {
        isComplex: complexityScore >= this.COMPLEXITY_THRESHOLD,
        complexityScore,
        reasons: reasons.filter(Boolean),
        priority,
        recommendedActions,
        confidence
      };

    } catch (error) {
      logger.error('Error analyzing case complexity:', error);
      return {
        isComplex: false,
        complexityScore: 0,
        reasons: ['Error en el análisis de complejidad'],
        priority: 'low',
        recommendedActions: ['Revisar manualmente'],
        confidence: 0
      };
    }
  }

  /**
   * Análisis del contenido del mensaje
   */
  private static analyzeMessageContent(message: string): { score: number; reasons: string[] } {
    const lowerMessage = message.toLowerCase();
    let score = 0;
    const reasons: string[] = [];

    // Palabras clave de complejidad (reducidas para evitar falsos positivos)
    const complexKeywords = [
      'complicado', 'complejo', 'muy difícil',
      'excepción', 'caso especial', 'situación especial',
      'personalizado', 'customizado'
      // REMOVIDO: 'problema', 'especial', 'diferente', 'varios', 'muchos', 'grupo'
      // Estas palabras son muy comunes en preguntas normales
    ];

    const keywordMatches = complexKeywords.filter(keyword => lowerMessage.includes(keyword));
    if (keywordMatches.length > 0) {
      score += keywordMatches.length;
      reasons.push(`Palabras de complejidad: ${keywordMatches.join(', ')}`);
    }

    // Longitud del mensaje (solo mensajes MUY largos indican complejidad)
    if (message.length > 400) {  // Aumentado de 200 a 400
      score += 1;
      reasons.push('Mensaje muy extenso');
    }

    // Múltiples preguntas en un mensaje (solo si son MUCHAS)
    const questionCount = (message.match(/\?/g) || []).length;
    if (questionCount > 4) {  // Aumentado de 2 a 4
      score += Math.floor((questionCount - 3) / 2);  // Reducido el peso
      reasons.push(`Muchas preguntas (${questionCount})`);
    }

    // Números o fechas específicas (pueden indicar requerimientos específicos)
    const numberPattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{1,2}:\d{2}\b|\b\d+\b/g;
    const numberMatches = message.match(numberPattern);
    if (numberMatches && numberMatches.length > 2) {
      score += 1;
      reasons.push('Múltiples referencias numéricas/fechas');
    }

    return { score, reasons };
  }

  /**
   * Análisis del historial de conversación
   */
  private static async analyzeConversationHistory(
    conversationId: string,
    context: ConversationContext
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    try {
      // Longitud de la conversación (solo conversaciones MUY largas)
      const messageCount = context.lastMessages.length;
      if (messageCount > 25) {  // Aumentado de 15 a 25
        score += 2;
        reasons.push(`Conversación muy extensa (${messageCount} mensajes)`);
      } else if (messageCount > 18) {  // Aumentado de 10 a 18
        score += 1;
        reasons.push(`Conversación larga (${messageCount} mensajes)`);
      }

      // Cambios de intención frecuentes (solo si son MUCHOS)
      const intentChanges = context.variables.intentChanges || 0;
      if (intentChanges > 5) {  // Aumentado de 3 a 5
        score += 2;
        reasons.push(`Múltiples cambios de intención (${intentChanges})`);
      }

      // Intentos fallidos (solo después de varios intentos)
      const failedAttempts = context.variables.failedAttempts || 0;
      if (failedAttempts > 4) {  // Aumentado de 2 a 4
        score += failedAttempts - 2;  // Reducido el peso
        reasons.push(`Múltiples intentos fallidos (${failedAttempts})`);
      }

      // Tiempo de duración de la conversación
      const messages = await ConversationModel.getMessages(conversationId, 50);
      if (messages.length > 0) {
        const firstMessage = messages[messages.length - 1];
        const lastMessage = messages[0];
        const duration = new Date(lastMessage.timestamp).getTime() - new Date(firstMessage.timestamp).getTime();
        const durationMinutes = duration / (1000 * 60);

        if (durationMinutes > 30) {
          score += 2;
          reasons.push(`Conversación prolongada (${Math.round(durationMinutes)} minutos)`);
        }
      }

      // Presencia de reserva pendiente compleja
      if (context.pendingBooking) {
        const booking = context.pendingBooking;
        if (booking.notes && booking.notes.length > 50) {
          score += 1;
          reasons.push('Reserva con notas especiales');
        }
      }

    } catch (error) {
      logger.error('Error analyzing conversation history:', error);
    }

    return { score, reasons };
  }

  /**
   * Análisis del comportamiento del cliente
   */
  private static async analyzeClientBehavior(
    clientId: string,
    context: ConversationContext
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    try {
      const client = await ClientModel.findById(clientId);
      if (!client) return { score: 0, reasons: [] };

      // Cliente con alergias o condiciones especiales
      if (client.allergies && client.allergies.length > 0) {
        score += 1;
        reasons.push(`Cliente con alergias (${client.allergies.length})`);
      }

      // Cliente VIP o con historial extenso
      if (client.loyaltyPoints > 1000) {
        score += 1;
        reasons.push('Cliente VIP');
      }

      // Historial de quejas previas
      const previousComplaints = context.variables.previousComplaints || 0;
      if (previousComplaints > 0) {
        score += previousComplaints;
        reasons.push(`Historial de quejas (${previousComplaints})`);
      }

    } catch (error) {
      logger.error('Error analyzing client behavior:', error);
    }

    return { score, reasons };
  }

  /**
   * Análisis de la intención y confianza
   */
  private static analyzeIntentComplexity(nluResult: IntentClassificationResult): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Baja confianza en la clasificación (solo si es MUY baja)
    if (nluResult.confidence < 0.4) {  // Reducido de 0.6 a 0.4
      score += 2;
      reasons.push(`Muy baja confianza en intención (${Math.round(nluResult.confidence * 100)}%)`);
    } else if (nluResult.confidence < 0.5) {  // Reducido de 0.8 a 0.5
      score += 1;
      reasons.push(`Baja confianza en intención (${Math.round(nluResult.confidence * 100)}%)`);
    }

    // Intenciones inherentemente complejas
    const complexIntents = [
      'reschedule_booking',
      'cancel_booking',
      'group_booking',
      'special_request',
      'complaint',
      'payment_issue'
    ];

    if (complexIntents.includes(nluResult.intent.name)) {
      score += 2;
      reasons.push(`Intención compleja: ${nluResult.intent.name}`);
    }

    // Múltiples entidades detectadas
    if (nluResult.entities.length > 3) {
      score += 1;
      reasons.push(`Múltiples entidades detectadas (${nluResult.entities.length})`);
    }

    return { score, reasons };
  }

  /**
   * Análisis de factores temporales
   */
  private static analyzeTemporalFactors(message: string, context: ConversationContext): { score: number; reasons: string[] } {
    const lowerMessage = message.toLowerCase();
    let score = 0;
    const reasons: string[] = [];

    // Palabras de urgencia temporal
    const urgentTimeKeywords = [
      'hoy', 'ahora', 'inmediato', 'urgente', 'ya',
      'esta mañana', 'esta tarde', 'en una hora'
    ];

    const urgentMatches = urgentTimeKeywords.filter(keyword => lowerMessage.includes(keyword));
    if (urgentMatches.length > 0) {
      score += urgentMatches.length * 2;
      reasons.push(`Urgencia temporal: ${urgentMatches.join(', ')}`);
    }

    // Restricciones de horario específicas
    const timeConstraints = [
      'antes de', 'después de', 'entre las', 'solo puedo',
      'únicamente', 'solamente'
    ];

    const constraintMatches = timeConstraints.filter(constraint => lowerMessage.includes(constraint));
    if (constraintMatches.length > 0) {
      score += 1;
      reasons.push('Restricciones de horario específicas');
    }

    return { score, reasons };
  }

  /**
   * Detectar palabras clave urgentes
   */
  private static detectUrgentKeywords(message: string): boolean {
    const urgentKeywords = [
      'emergencia', 'emergency', 'urgente', 'urgent',
      'problema grave', 'serious problem', 'ayuda',
      'dolor', 'reacción alérgica', 'sangrado'
    ];

    const lowerMessage = message.toLowerCase();
    return urgentKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Detectar patrones de emergencia
   */
  private static detectEmergencyPatterns(message: string): boolean {
    const emergencyPatterns = [
      /\b(no puedo|cannot).*(respirar|breathe)\b/i,
      /\b(mucho dolor|severe pain)\b/i,
      /\b(reacción alérgica|allergic reaction)\b/i,
      /\b(sangre|blood|bleeding)\b/i
    ];

    return emergencyPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Generar acciones recomendadas
   */
  private static generateRecommendedActions(
    complexityScore: number,
    reasons: string[],
    priority: EscalationPriority
  ): string[] {
    const actions: string[] = [];

    if (priority === 'urgent') {
      actions.push('CONTACTO INMEDIATO REQUERIDO');
      actions.push('Verificar si requiere atención médica');
    }

    if (complexityScore >= this.HIGH_COMPLEXITY_THRESHOLD) {
      actions.push('Asignar a agente senior');
      actions.push('Revisar historial completo del cliente');
    }

    if (reasons.some(r => r.includes('alergia'))) {
      actions.push('Revisar alergias del cliente antes de proceder');
    }

    if (reasons.some(r => r.includes('VIP'))) {
      actions.push('Aplicar protocolo VIP');
    }

    if (reasons.some(r => r.includes('queja'))) {
      actions.push('Preparar respuesta empática');
      actions.push('Considerar compensación');
    }

    if (reasons.some(r => r.includes('urgencia temporal'))) {
      actions.push('Verificar disponibilidad inmediata');
      actions.push('Considerar horarios especiales');
    }

    // Acciones generales
    actions.push('Documentar resolución detalladamente');
    actions.push('Hacer seguimiento post-resolución');

    return actions;
  }

  /**
   * Calcular confianza del análisis
   */
  private static calculateAnalysisConfidence(complexityScore: number, reasonCount: number): number {
    // Base confidence on score and number of reasons
    let confidence = Math.min(0.9, (complexityScore * 0.1) + (reasonCount * 0.05));
    
    // Minimum confidence
    confidence = Math.max(0.3, confidence);
    
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Obtener recomendación de escalación
   */
  static getEscalationRecommendation(analysis: ComplexityAnalysis): {
    shouldEscalate: boolean;
    reason: EscalationReason;
    summary: string;
  } {
    if (!analysis.isComplex) {
      return {
        shouldEscalate: false,
        reason: 'complex_request',
        summary: 'Caso no requiere escalación'
      };
    }

    let reason: EscalationReason = 'complex_request';
    
    // Determinar razón específica basada en los factores detectados
    if (analysis.reasons.some(r => r.includes('queja') || r.includes('complaint'))) {
      reason = 'complaint';
    } else if (analysis.reasons.some(r => r.includes('pago') || r.includes('payment'))) {
      reason = 'payment_issue';
    } else if (analysis.reasons.some(r => r.includes('fallido') || r.includes('failed'))) {
      reason = 'failed_attempts';
    } else if (analysis.reasons.some(r => r.includes('confianza') || r.includes('confidence'))) {
      reason = 'low_confidence';
    }

    const summary = `Caso complejo detectado (Score: ${analysis.complexityScore}). Factores: ${analysis.reasons.slice(0, 3).join('; ')}`;

    return {
      shouldEscalate: true,
      reason,
      summary
    };
  }
}