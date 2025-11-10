import { ConversationModel } from '../../models/Conversation';
import { ContextManager } from './ContextManager';
import { NotificationService } from '../NotificationService';
import { ComplexCaseDetector } from './ComplexCaseDetector';
import { 
  EscalationRequest, 
  EscalationReason, 
  EscalationPriority, 
  ConversationContext,
  ConversationSummary,
  IntentClassificationResult,
  Message
} from '../../types/ai';
import { Client } from '../../types/client';
import logger from '../../utils/logger';

export class EscalationService {
  // Configuración de escalación
  private static config = {
    confidenceThreshold: 0.6,
    maxFailedAttempts: 3,
    complexityKeywords: [
      'problema', 'queja', 'error', 'mal servicio', 'insatisfecho',
      'reembolso', 'cancelar todo', 'gerente', 'supervisor',
      'legal', 'demanda', 'abogado', 'denuncia'
    ],
    // Palabras clave para detectar casos complejos
    complexCaseKeywords: [
      'complicado', 'complejo', 'especial', 'personalizado', 'excepción',
      'urgente', 'emergencia', 'problema médico', 'alergia severa',
      'múltiples servicios', 'grupo grande', 'evento especial',
      'horario especial', 'fuera de horario', 'día festivo'
    ],
    // Patrones de comportamiento que indican complejidad
    complexityIndicators: {
      multipleIntentChanges: 3, // Cambios de intención en una conversación
      longConversationThreshold: 15, // Número de mensajes
      repeatedQuestions: 2, // Preguntas repetidas sobre el mismo tema
      multipleServiceInquiries: 3, // Consultas sobre múltiples servicios
      timeConstraints: ['hoy', 'ahora', 'urgente', 'inmediato'],
      specialRequests: ['descuento', 'precio especial', 'excepción', 'favor']
    },
    escalationReasons: {
      low_confidence: { priority: 'medium' as EscalationPriority, autoEscalate: true },
      failed_attempts: { priority: 'medium' as EscalationPriority, autoEscalate: true },
      complaint: { priority: 'high' as EscalationPriority, autoEscalate: true },
      complex_request: { priority: 'medium' as EscalationPriority, autoEscalate: false },
      technical_issue: { priority: 'low' as EscalationPriority, autoEscalate: false },
      payment_issue: { priority: 'high' as EscalationPriority, autoEscalate: true },
      client_request: { priority: 'low' as EscalationPriority, autoEscalate: false }
    }
  };

  // Registro de escalaciones activas
  private static activeEscalations = new Map<string, {
    escalationId: string;
    conversationId: string;
    reason: EscalationReason;
    priority: EscalationPriority;
    timestamp: Date;
    humanAgentId?: string;
    status: 'pending' | 'assigned' | 'resolved';
  }>();

  /**
   * Evaluar si una conversación necesita escalación
   */
  static async evaluateEscalationNeed(
    conversationId: string,
    nluResult: IntentClassificationResult,
    context: ConversationContext,
    client: Client
  ): Promise<{
    shouldEscalate: boolean;
    reason?: EscalationReason;
    priority?: EscalationPriority;
    summary?: string;
  }> {
    try {
      // 1. Verificar confianza baja
      if (nluResult.confidence < this.config.confidenceThreshold) {
        const failedAttempts = (context.variables.failedAttempts || 0) + 1;
        await ContextManager.setVariable(conversationId, 'failedAttempts', failedAttempts);

        if (failedAttempts >= this.config.maxFailedAttempts) {
          return {
            shouldEscalate: true,
            reason: 'failed_attempts',
            priority: 'medium',
            summary: `Cliente ${client.name} ha tenido ${failedAttempts} intentos fallidos de comunicación`
          };
        }
      }

      // 2. Detectar quejas o problemas
      const messageContent = context.lastMessages[context.lastMessages.length - 1]?.content || '';
      if (this.detectComplaint(messageContent)) {
        return {
          shouldEscalate: true,
          reason: 'complaint',
          priority: 'high',
          summary: `Posible queja detectada del cliente ${client.name}: "${messageContent.substring(0, 100)}..."`
        };
      }

      // 3. Detectar solicitudes complejas usando el detector avanzado
      const complexityAnalysis = await ComplexCaseDetector.analyzeCase(
        conversationId,
        messageContent,
        nluResult,
        context,
        client.id
      );

      if (complexityAnalysis.isComplex) {
        const recommendation = ComplexCaseDetector.getEscalationRecommendation(complexityAnalysis);
        
        // Actualizar variables de contexto con el análisis
        await ContextManager.setVariable(conversationId, 'complexityAnalysis', complexityAnalysis);
        
        return {
          shouldEscalate: true,
          reason: recommendation.reason,
          priority: complexityAnalysis.priority,
          summary: `${recommendation.summary}. Acciones recomendadas: ${complexityAnalysis.recommendedActions.slice(0, 2).join(', ')}`
        };
      }

      // 4. Verificar solicitud explícita de agente humano
      if (this.detectHumanAgentRequest(messageContent)) {
        return {
          shouldEscalate: true,
          reason: 'client_request',
          priority: 'low',
          summary: `Cliente ${client.name} solicita hablar con un agente humano`
        };
      }

      // 5. Verificar problemas de pago
      if (this.detectPaymentIssue(messageContent)) {
        return {
          shouldEscalate: true,
          reason: 'payment_issue',
          priority: 'high',
          summary: `Problema de pago detectado para cliente ${client.name}`
        };
      }

      return { shouldEscalate: false };

    } catch (error) {
      logger.error('Error evaluating escalation need:', error);
      return {
        shouldEscalate: true,
        reason: 'technical_issue',
        priority: 'low',
        summary: 'Error técnico en el sistema de IA'
      };
    }
  }

  /**
   * Ejecutar escalación a agente humano
   */
  static async escalateToHuman(
    conversationId: string,
    reason: EscalationReason,
    priority: EscalationPriority = 'medium',
    summary?: string,
    humanAgentId?: string
  ): Promise<{
    success: boolean;
    escalationId?: string;
    message: string;
  }> {
    try {
      // 1. Obtener contexto completo de la conversación
      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        return {
          success: false,
          message: 'Conversación no encontrada'
        };
      }

      // 2. Generar resumen de contexto
      const contextSummary = await this.generateContextSummary(conversationId, conversation.clientId);

      // 3. Crear solicitud de escalación
      const escalationRequest: EscalationRequest = {
        conversationId,
        reason,
        priority,
        summary: summary || contextSummary.summary,
        clientContext: {
          clientId: conversation.clientId,
          conversationHistory: contextSummary.recentMessages,
          currentIntent: conversation.context.currentIntent,
          pendingBooking: conversation.context.pendingBooking,
          variables: conversation.context.variables
        }
      };

      // 4. Registrar escalación
      const escalationId = this.generateEscalationId();
      this.activeEscalations.set(escalationId, {
        escalationId,
        conversationId,
        reason,
        priority,
        timestamp: new Date(),
        humanAgentId,
        status: humanAgentId ? 'assigned' : 'pending'
      });

      // 5. Actualizar estado de la conversación
      await ConversationModel.escalateConversation(
        conversationId,
        `${reason}: ${summary || 'Escalación automática'}`,
        humanAgentId
      );

      // 6. Enviar notificaciones a agentes humanos
      await this.notifyHumanAgents(escalationRequest, escalationId);

      // 7. Registrar en logs
      logger.info(`Conversation escalated: ${conversationId} -> ${escalationId}`, {
        reason,
        priority,
        clientId: conversation.clientId,
        humanAgentId
      });

      return {
        success: true,
        escalationId,
        message: 'Escalación procesada exitosamente'
      };

    } catch (error) {
      logger.error('Error escalating to human:', error);
      return {
        success: false,
        message: 'Error procesando la escalación'
      };
    }
  }

  /**
   * Asignar agente humano a escalación
   */
  static async assignHumanAgent(
    escalationId: string,
    humanAgentId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const escalation = this.activeEscalations.get(escalationId);
      if (!escalation) {
        return {
          success: false,
          message: 'Escalación no encontrada'
        };
      }

      // Actualizar escalación
      escalation.humanAgentId = humanAgentId;
      escalation.status = 'assigned';
      this.activeEscalations.set(escalationId, escalation);

      // Actualizar conversación
      await ConversationModel.escalateConversation(
        escalation.conversationId,
        escalation.reason,
        humanAgentId
      );

      logger.info(`Human agent assigned: ${humanAgentId} -> ${escalationId}`);

      return {
        success: true,
        message: 'Agente humano asignado exitosamente'
      };

    } catch (error) {
      logger.error('Error assigning human agent:', error);
      return {
        success: false,
        message: 'Error asignando agente humano'
      };
    }
  }

  /**
   * Resolver escalación
   */
  static async resolveEscalation(
    escalationId: string,
    resolution: string,
    humanAgentId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const escalation = this.activeEscalations.get(escalationId);
      if (!escalation) {
        return {
          success: false,
          message: 'Escalación no encontrada'
        };
      }

      // Verificar que el agente tiene permisos
      if (escalation.humanAgentId && escalation.humanAgentId !== humanAgentId) {
        return {
          success: false,
          message: 'No tienes permisos para resolver esta escalación'
        };
      }

      // Marcar como resuelta
      escalation.status = 'resolved';
      this.activeEscalations.set(escalationId, escalation);

      // Cerrar conversación o devolverla al IA
      await ConversationModel.closeConversation(escalation.conversationId);

      // Registrar resolución
      logger.info(`Escalation resolved: ${escalationId} by ${humanAgentId}`, {
        resolution: resolution.substring(0, 100)
      });

      // Limpiar escalación después de un tiempo
      setTimeout(() => {
        this.activeEscalations.delete(escalationId);
      }, 24 * 60 * 60 * 1000); // 24 horas

      return {
        success: true,
        message: 'Escalación resuelta exitosamente'
      };

    } catch (error) {
      logger.error('Error resolving escalation:', error);
      return {
        success: false,
        message: 'Error resolviendo la escalación'
      };
    }
  }

  /**
   * Obtener escalaciones activas
   */
  static getActiveEscalations(filters?: {
    priority?: EscalationPriority;
    reason?: EscalationReason;
    status?: 'pending' | 'assigned' | 'resolved';
    humanAgentId?: string;
  }): Array<{
    escalationId: string;
    conversationId: string;
    reason: EscalationReason;
    priority: EscalationPriority;
    timestamp: Date;
    humanAgentId?: string;
    status: 'pending' | 'assigned' | 'resolved';
  }> {
    let escalations = Array.from(this.activeEscalations.values());

    if (filters) {
      if (filters.priority) {
        escalations = escalations.filter(e => e.priority === filters.priority);
      }
      if (filters.reason) {
        escalations = escalations.filter(e => e.reason === filters.reason);
      }
      if (filters.status) {
        escalations = escalations.filter(e => e.status === filters.status);
      }
      if (filters.humanAgentId) {
        escalations = escalations.filter(e => e.humanAgentId === filters.humanAgentId);
      }
    }

    return escalations.sort((a, b) => {
      // Ordenar por prioridad y luego por fecha
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Obtener estadísticas de escalación
   */
  static getEscalationStats(): {
    totalEscalations: number;
    pendingEscalations: number;
    assignedEscalations: number;
    resolvedEscalations: number;
    escalationsByReason: Record<EscalationReason, number>;
    escalationsByPriority: Record<EscalationPriority, number>;
    averageResolutionTime: number;
  } {
    const escalations = Array.from(this.activeEscalations.values());
    
    const stats = {
      totalEscalations: escalations.length,
      pendingEscalations: escalations.filter(e => e.status === 'pending').length,
      assignedEscalations: escalations.filter(e => e.status === 'assigned').length,
      resolvedEscalations: escalations.filter(e => e.status === 'resolved').length,
      escalationsByReason: {} as Record<EscalationReason, number>,
      escalationsByPriority: {} as Record<EscalationPriority, number>,
      averageResolutionTime: 0
    };

    // Contar por razón
    escalations.forEach(e => {
      stats.escalationsByReason[e.reason] = (stats.escalationsByReason[e.reason] || 0) + 1;
    });

    // Contar por prioridad
    escalations.forEach(e => {
      stats.escalationsByPriority[e.priority] = (stats.escalationsByPriority[e.priority] || 0) + 1;
    });

    return stats;
  }

  // Métodos privados de detección

  private static detectComplaint(message: string): boolean {
    const complaintKeywords = [
      'queja', 'problema', 'mal servicio', 'insatisfecho', 'molesto',
      'terrible', 'horrible', 'pésimo', 'fatal', 'desastre',
      'reembolso', 'devolver dinero', 'cancelar todo'
    ];

    const lowerMessage = message.toLowerCase();
    return complaintKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Análisis avanzado de complejidad de casos
   */
  private static async analyzeComplexity(
    conversationId: string,
    message: string,
    nluResult: IntentClassificationResult,
    context: ConversationContext
  ): Promise<{
    isComplex: boolean;
    reason?: string;
    priority: EscalationPriority;
    details?: string;
  }> {
    const lowerMessage = message.toLowerCase();
    let complexityScore = 0;
    const reasons: string[] = [];

    // 1. Verificar palabras clave de complejidad
    const complexKeywordMatches = this.config.complexCaseKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    );
    if (complexKeywordMatches.length > 0) {
      complexityScore += complexKeywordMatches.length * 2;
      reasons.push(`Palabras clave complejas: ${complexKeywordMatches.join(', ')}`);
    }

    // 2. Analizar cambios de intención frecuentes
    const intentChanges = context.variables.intentChanges || 0;
    if (intentChanges >= this.config.complexityIndicators.multipleIntentChanges) {
      complexityScore += 3;
      reasons.push(`Múltiples cambios de intención (${intentChanges})`);
    }

    // 3. Verificar longitud de conversación
    const messageCount = context.lastMessages.length;
    if (messageCount >= this.config.complexityIndicators.longConversationThreshold) {
      complexityScore += 2;
      reasons.push(`Conversación extensa (${messageCount} mensajes)`);
    }

    // 4. Detectar preguntas repetidas
    const repeatedQuestions = this.detectRepeatedQuestions(context.lastMessages);
    if (repeatedQuestions >= this.config.complexityIndicators.repeatedQuestions) {
      complexityScore += 2;
      reasons.push(`Preguntas repetidas detectadas (${repeatedQuestions})`);
    }

    // 5. Múltiples consultas de servicios
    const serviceInquiries = context.variables.serviceInquiries || 0;
    if (serviceInquiries >= this.config.complexityIndicators.multipleServiceInquiries) {
      complexityScore += 2;
      reasons.push(`Consultas sobre múltiples servicios (${serviceInquiries})`);
    }

    // 6. Restricciones de tiempo urgentes
    const timeConstraints = this.config.complexityIndicators.timeConstraints.filter(constraint =>
      lowerMessage.includes(constraint)
    );
    if (timeConstraints.length > 0) {
      complexityScore += 3;
      reasons.push(`Restricciones de tiempo urgentes: ${timeConstraints.join(', ')}`);
    }

    // 7. Solicitudes especiales
    const specialRequests = this.config.complexityIndicators.specialRequests.filter(request =>
      lowerMessage.includes(request)
    );
    if (specialRequests.length > 0) {
      complexityScore += 2;
      reasons.push(`Solicitudes especiales: ${specialRequests.join(', ')}`);
    }

    // 8. Intenciones complejas específicas
    const complexIntents = ['reschedule_booking', 'cancel_booking', 'payment_issue', 'group_booking'];
    if (complexIntents.includes(nluResult.intent.name)) {
      complexityScore += 1;
      reasons.push(`Intención compleja: ${nluResult.intent.name}`);
    }

    // 9. Baja confianza persistente
    if (nluResult.confidence < this.config.confidenceThreshold) {
      const lowConfidenceCount = context.variables.lowConfidenceCount || 0;
      if (lowConfidenceCount >= 2) {
        complexityScore += 2;
        reasons.push(`Baja confianza persistente (${lowConfidenceCount} veces)`);
      }
    }

    // Determinar si es complejo y la prioridad
    const isComplex = complexityScore >= 4;
    let priority: EscalationPriority = 'low';

    if (complexityScore >= 8) {
      priority = 'high';
    } else if (complexityScore >= 6) {
      priority = 'medium';
    }

    // Casos especiales que requieren prioridad alta
    if (timeConstraints.length > 0 || lowerMessage.includes('emergencia') || lowerMessage.includes('problema médico')) {
      priority = 'high';
    }

    return {
      isComplex,
      reason: isComplex ? 'Análisis de complejidad automático' : undefined,
      priority,
      details: isComplex ? `Score: ${complexityScore}. Factores: ${reasons.join('; ')}` : undefined
    };
  }

  /**
   * Detectar preguntas repetidas en el historial
   */
  private static detectRepeatedQuestions(messages: Message[]): number {
    const questions = messages
      .filter(msg => msg.senderType === 'client' && msg.content.includes('?'))
      .map(msg => msg.content.toLowerCase().trim());

    const questionCounts = new Map<string, number>();
    questions.forEach(question => {
      questionCounts.set(question, (questionCounts.get(question) || 0) + 1);
    });

    return Math.max(...Array.from(questionCounts.values()), 0) - 1;
  }

  private static detectComplexRequest(message: string, intent: string): boolean {
    const complexIntents = ['reschedule_booking', 'cancel_booking', 'payment_issue'];
    const complexKeywords = [
      'complicado', 'especial', 'personalizado', 'excepción',
      'urgente', 'emergencia', 'problema médico'
    ];

    if (complexIntents.includes(intent)) return true;

    const lowerMessage = message.toLowerCase();
    return complexKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private static detectHumanAgentRequest(message: string): boolean {
    const humanKeywords = [
      'agente humano', 'persona real', 'hablar con alguien',
      'gerente', 'supervisor', 'responsable', 'encargado',
      'no entiendes', 'no me ayudas', 'quiero hablar con'
    ];

    const lowerMessage = message.toLowerCase();
    return humanKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private static detectPaymentIssue(message: string): boolean {
    const paymentKeywords = [
      'pago', 'cobro', 'tarjeta', 'factura', 'precio incorrecto',
      'no he pagado', 'doble cobro', 'reembolso', 'devolver dinero'
    ];

    const lowerMessage = message.toLowerCase();
    return paymentKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private static async generateContextSummary(conversationId: string, clientId: string): Promise<{
    summary: string;
    recentMessages: any[];
  }> {
    try {
      const contextSummary = await ContextManager.getContextSummary(conversationId);
      const messages = await ConversationModel.getMessages(conversationId, 10);

      const summary = `Cliente: ${clientId}
Intención actual: ${contextSummary.intent || 'No definida'}
Flujo: ${contextSummary.flow || 'No definido'}
Reserva pendiente: ${contextSummary.pendingBooking ? 'Sí' : 'No'}
Mensajes recientes: ${messages.length}`;

      return {
        summary,
        recentMessages: messages
      };
    } catch (error) {
      return {
        summary: 'Error generando resumen de contexto',
        recentMessages: []
      };
    }
  }

  private static async notifyHumanAgents(
    escalationRequest: EscalationRequest,
    escalationId: string
  ): Promise<void> {
    try {
      // Integrar con AlertService para enviar notificaciones
      const { AlertService } = await import('../AlertService');
      
      await AlertService.sendEscalationAlert(
        escalationId,
        escalationRequest.conversationId,
        escalationRequest.reason,
        escalationRequest.priority,
        escalationRequest.clientContext.clientId,
        escalationRequest.summary
      );

      logger.info(`Human agents notified about escalation ${escalationId}`, {
        reason: escalationRequest.reason,
        priority: escalationRequest.priority,
        conversationId: escalationRequest.conversationId
      });
    } catch (error) {
      logger.error('Error notifying human agents:', error);
    }
  }

  private static generateEscalationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ESC_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Limpiar escalaciones antiguas
   */
  static cleanupOldEscalations(hoursOld: number = 48): number {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursOld);

    let cleanedCount = 0;
    for (const [escalationId, escalation] of this.activeEscalations.entries()) {
      if (escalation.timestamp < cutoffTime && escalation.status === 'resolved') {
        this.activeEscalations.delete(escalationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} old escalations`);
    }

    return cleanedCount;
  }

  /**
   * Obtener configuración actual
   */
  static getConfig() {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(newConfig: Partial<typeof EscalationService.config>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('EscalationService configuration updated:', this.config);
  }
}