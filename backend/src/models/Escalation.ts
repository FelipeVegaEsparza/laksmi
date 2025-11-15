import db from '../config/database';
import logger from '../utils/logger';

export type EscalationReason = 
  | 'low_confidence'
  | 'failed_attempts'
  | 'complaint'
  | 'complex_request'
  | 'technical_issue'
  | 'payment_issue'
  | 'client_request';

export type EscalationPriority = 'urgent' | 'high' | 'medium' | 'low';

export type EscalationStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';

export interface Escalation {
  id: string;
  escalationCode: string;
  conversationId: string;
  clientId: string;
  reason: EscalationReason;
  priority: EscalationPriority;
  status: EscalationStatus;
  summary: string;
  clientMessage?: string;
  aiResponse?: string;
  confidenceScore?: number;
  assignedTo?: string;
  assignedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  resolutionTimeMinutes?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationWithDetails extends Escalation {
  clientName?: string;
  clientPhone?: string;
  assignedToName?: string;
  ageMinutes?: number;
  slaStatus?: 'overdue' | 'on_time' | 'completed';
  notificationsSent?: number;
  historyCount?: number;
}

export class EscalationModel {
  /**
   * Crear nueva escalación
   */
  static async create(data: {
    escalationCode: string;
    conversationId: string;
    clientId: string;
    reason: EscalationReason;
    priority: EscalationPriority;
    summary: string;
    clientMessage?: string;
    aiResponse?: string;
    confidenceScore?: number;
    metadata?: any;
  }): Promise<Escalation> {
    const [id] = await db('escalations').insert({
      escalation_code: data.escalationCode,
      conversation_id: data.conversationId,
      client_id: data.clientId,
      reason: data.reason,
      priority: data.priority,
      summary: data.summary,
      client_message: data.clientMessage || null,
      ai_response: data.aiResponse || null,
      confidence_score: data.confidenceScore || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    });

    logger.info('Escalation created', {
      escalationId: id,
      escalationCode: data.escalationCode,
      reason: data.reason,
      priority: data.priority
    });

    return this.findByCode(data.escalationCode) as Promise<Escalation>;
  }

  /**
   * Buscar escalación por código
   */
  static async findByCode(escalationCode: string): Promise<Escalation | null> {
    const row = await db('escalations')
      .where('escalation_code', escalationCode)
      .first();

    if (!row) return null;

    return {
      id: row.id,
      escalationCode: row.escalation_code,
      conversationId: row.conversation_id,
      clientId: row.client_id,
      reason: row.reason,
      priority: row.priority,
      status: row.status,
      summary: row.summary,
      clientMessage: row.client_message,
      aiResponse: row.ai_response,
      confidenceScore: row.confidence_score,
      assignedTo: row.assigned_to,
      assignedAt: row.assigned_at,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      resolutionNotes: row.resolution_notes,
      resolutionTimeMinutes: row.resolution_time_minutes,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Buscar escalación por ID
   */
  static async findById(id: string): Promise<Escalation | null> {
    const row = await db('escalations')
      .where('id', id)
      .first();

    if (!row) return null;

    return {
      id: row.id,
      escalationCode: row.escalation_code,
      conversationId: row.conversation_id,
      clientId: row.client_id,
      reason: row.reason,
      priority: row.priority,
      status: row.status,
      summary: row.summary,
      clientMessage: row.client_message,
      aiResponse: row.ai_response,
      confidenceScore: row.confidence_score,
      assignedTo: row.assigned_to,
      assignedAt: row.assigned_at,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      resolutionNotes: row.resolution_notes,
      resolutionTimeMinutes: row.resolution_time_minutes,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Obtener escalaciones con filtros
   */
  static async findAll(filters?: {
    status?: EscalationStatus | EscalationStatus[];
    priority?: EscalationPriority | EscalationPriority[];
    reason?: EscalationReason;
    assignedTo?: string;
    clientId?: string;
    conversationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<EscalationWithDetails[]> {
    let query = db('escalations_dashboard');

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.whereIn('status', filters.status);
      } else {
        query = query.where('status', filters.status);
      }
    }

    if (filters?.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.whereIn('priority', filters.priority);
      } else {
        query = query.where('priority', filters.priority);
      }
    }

    if (filters?.reason) {
      query = query.where('reason', filters.reason);
    }

    if (filters?.assignedTo) {
      query = query.where('assigned_to', filters.assignedTo);
    }

    if (filters?.clientId) {
      query = query.where('client_id', filters.clientId);
    }

    if (filters?.conversationId) {
      query = query.where('conversation_id', filters.conversationId);
    }

    query = query.orderByRaw(`
      CASE priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END, created_at DESC
    `);

    if (filters?.limit) {
      query = query.limit(filters.limit);
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }
    }

    const rows = await query;

    return rows.map((row: any) => ({
      id: row.id,
      escalationCode: row.escalation_code,
      conversationId: row.conversation_id,
      clientId: row.client_id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      reason: row.reason,
      priority: row.priority,
      status: row.status,
      summary: row.summary,
      confidenceScore: row.confidence_score,
      assignedTo: row.assigned_to,
      assignedToName: row.assigned_to_name,
      assignedAt: row.assigned_at,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
      resolutionTimeMinutes: row.resolution_time_minutes,
      ageMinutes: row.age_minutes,
      slaStatus: row.sla_status,
      notificationsSent: row.notifications_sent,
      historyCount: row.history_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Asignar agente a escalación
   */
  static async assign(escalationId: string, userId: string): Promise<boolean> {
    const result = await db('escalations')
      .where({ id: escalationId, status: 'pending' })
      .update({
        assigned_to: userId,
        assigned_at: db.fn.now(),
        status: 'assigned'
      });

    if (result > 0) {
      logger.info('Escalation assigned', { escalationId, userId });
      return true;
    }

    return false;
  }

  /**
   * Actualizar estado de escalación
   */
  static async updateStatus(
    escalationId: string,
    status: EscalationStatus,
    userId?: string
  ): Promise<boolean> {
    const result = await db('escalations')
      .where({ id: escalationId })
      .update({
        status,
        updated_at: db.fn.now()
      });

    if (result > 0) {
      logger.info('Escalation status updated', { escalationId, status, userId });
      return true;
    }

    return false;
  }

  /**
   * Resolver escalación
   */
  static async resolve(
    escalationId: string,
    userId: string,
    resolutionNotes: string
  ): Promise<boolean> {
    const result = await db('escalations')
      .where({ id: escalationId })
      .whereIn('status', ['pending', 'assigned', 'in_progress'])
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: db.fn.now(),
        resolution_notes: resolutionNotes,
        resolution_time_minutes: db.raw('TIMESTAMPDIFF(MINUTE, created_at, NOW())')
      });

    if (result > 0) {
      logger.info('Escalation resolved', { escalationId, userId });
      return true;
    }

    return false;
  }

  /**
   * Obtener estadísticas de escalaciones
   */
  static async getStats(filters?: {
    startDate?: Date;
    endDate?: Date;
    assignedTo?: string;
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byReason: Record<string, number>;
    averageResolutionTime: number;
    slaCompliance: number;
  }> {
    let query = db('escalations')
      .select('status', 'priority', 'reason')
      .count('* as total')
      .avg('resolution_time_minutes as avg_resolution_time')
      .groupBy('status', 'priority', 'reason');

    if (filters?.startDate) {
      query = query.where('created_at', '>=', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where('created_at', '<=', filters.endDate);
    }

    if (filters?.assignedTo) {
      query = query.where('assigned_to', filters.assignedTo);
    }

    const rows = await query;

    // Procesar resultados
    const stats = {
      total: 0,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byReason: {} as Record<string, number>,
      averageResolutionTime: 0,
      slaCompliance: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    rows.forEach((row: any) => {
      const count = typeof row.total === 'string' ? parseInt(row.total) : row.total;
      stats.total += count;
      stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + count;
      stats.byPriority[row.priority] = (stats.byPriority[row.priority] || 0) + count;
      stats.byReason[row.reason] = (stats.byReason[row.reason] || 0) + count;

      if (row.status === 'resolved' && row.avg_resolution_time) {
        const avgTime = typeof row.avg_resolution_time === 'string' ? parseFloat(row.avg_resolution_time) : row.avg_resolution_time;
        totalResolutionTime += avgTime * count;
        resolvedCount += count;
      }
    });

    if (resolvedCount > 0) {
      stats.averageResolutionTime = Math.round(totalResolutionTime / resolvedCount);
    }

    // Calcular SLA compliance
    const slaRows = await db('escalations_dashboard')
      .where('status', 'resolved')
      .count('* as total')
      .sum(db.raw("CASE WHEN sla_status IN ('on_time', 'completed') THEN 1 ELSE 0 END as compliant"))
      .first();

    if (slaRows) {
      const total = typeof slaRows.total === 'string' ? parseInt(slaRows.total) : slaRows.total;
      const compliant = typeof slaRows.compliant === 'string' ? parseInt(slaRows.compliant) : slaRows.compliant;
      if (total > 0) {
        stats.slaCompliance = Math.round((compliant / total) * 100);
      }
    }

    return stats;
  }

  /**
   * Obtener escalaciones pendientes (para dashboard)
   */
  static async getPending(limit: number = 50): Promise<EscalationWithDetails[]> {
    return this.findAll({
      status: ['pending', 'assigned', 'in_progress'],
      limit
    });
  }

  /**
   * Obtener escalaciones urgentes sin asignar
   */
  static async getUrgentUnassigned(): Promise<EscalationWithDetails[]> {
    return this.findAll({
      status: 'pending',
      priority: ['urgent', 'high']
    });
  }

  /**
   * Contar escalaciones pendientes por prioridad
   */
  static async countPendingByPriority(): Promise<Record<EscalationPriority, number>> {
    const rows = await db('escalations')
      .select('priority')
      .count('* as count')
      .whereIn('status', ['pending', 'assigned', 'in_progress'])
      .groupBy('priority');

    const counts: Record<EscalationPriority, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    rows.forEach((row: any) => {
      counts[row.priority as EscalationPriority] = parseInt(row.count);
    });

    return counts;
  }
}
