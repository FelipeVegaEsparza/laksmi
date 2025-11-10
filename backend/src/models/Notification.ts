import db from '../config/database';
import { 
  ScheduledNotification, 
  CreateNotificationRequest, 
  UpdateNotificationRequest, 
  NotificationFilters,
  NotificationStats,
  NotificationType,
  NotificationChannel,
  NotificationStatus
} from '../types/notification';

export class NotificationModel {
  static async findById(id: string): Promise<ScheduledNotification | null> {
    const notification = await db('scheduled_notifications').where({ id }).first();
    if (!notification) return null;
    
    return this.formatNotification(notification);
  }

  static async create(notificationData: CreateNotificationRequest): Promise<ScheduledNotification> {
    const insertData = {
      client_id: notificationData.clientId,
      booking_id: notificationData.bookingId || null,
      type: notificationData.type,
      channel: notificationData.channel,
      scheduled_for: notificationData.scheduledFor,
      status: 'pending',
      template_name: notificationData.templateName,
      template_data: JSON.stringify(notificationData.templateData),
      retry_count: 0
    };

    await db('scheduled_notifications').insert(insertData);

    // Buscar la notificación recién creada
    const notification = await db('scheduled_notifications')
      .where({
        client_id: notificationData.clientId,
        scheduled_for: notificationData.scheduledFor,
        template_name: notificationData.templateName
      })
      .orderBy('created_at', 'desc')
      .first();
    
    if (!notification) {
      throw new Error('Error creating notification');
    }

    return this.formatNotification(notification);
  }

  static async update(id: string, updates: UpdateNotificationRequest): Promise<ScheduledNotification | null> {
    const updateData: any = {};
    
    if (updates.scheduledFor !== undefined) updateData.scheduled_for = updates.scheduledFor;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.templateData !== undefined) updateData.template_data = JSON.stringify(updates.templateData);
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
    
    updateData.updated_at = new Date();

    // Si se marca como enviada, registrar la fecha
    if (updates.status === 'sent') {
      updateData.sent_at = new Date();
    }

    const result = await db('scheduled_notifications').where({ id }).update(updateData);
    
    if (result === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async findAll(filters: NotificationFilters = {}): Promise<{ notifications: ScheduledNotification[]; total: number }> {
    const { 
      clientId, 
      bookingId, 
      type, 
      channel, 
      status, 
      scheduledFrom, 
      scheduledTo, 
      page = 1, 
      limit = 10 
    } = filters;
    
    let query = db('scheduled_notifications').select('*');

    // Aplicar filtros
    if (clientId) {
      query = query.where('client_id', clientId);
    }

    if (bookingId) {
      query = query.where('booking_id', bookingId);
    }

    if (type) {
      query = query.where('type', type);
    }

    if (channel) {
      query = query.where('channel', channel);
    }

    if (status) {
      query = query.where('status', status);
    }

    if (scheduledFrom) {
      query = query.where('scheduled_for', '>=', scheduledFrom);
    }

    if (scheduledTo) {
      query = query.where('scheduled_for', '<=', scheduledTo);
    }

    // Contar total de registros
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string);

    // Aplicar paginación
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset).orderBy('scheduled_for', 'asc');

    const notifications = await query;
    
    return {
      notifications: notifications.map(notification => this.formatNotification(notification)),
      total
    };
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db('scheduled_notifications').where({ id }).del();
    return result > 0;
  }

  static async getPendingNotifications(limit: number = 100): Promise<ScheduledNotification[]> {
    const now = new Date();
    
    const notifications = await db('scheduled_notifications')
      .where('status', 'pending')
      .where('scheduled_for', '<=', now)
      .where('retry_count', '<', 3) // Máximo 3 intentos
      .orderBy('scheduled_for', 'asc')
      .limit(limit);

    return notifications.map(notification => this.formatNotification(notification));
  }

  static async markAsSent(id: string, externalId?: string): Promise<void> {
    await db('scheduled_notifications')
      .where({ id })
      .update({
        status: 'sent',
        sent_at: new Date(),
        updated_at: new Date(),
        external_id: externalId || null
      });
  }

  static async markAsFailed(id: string, errorMessage: string): Promise<void> {
    await db('scheduled_notifications')
      .where({ id })
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date()
      });
  }

  static async incrementRetryCount(id: string): Promise<void> {
    await db('scheduled_notifications')
      .where({ id })
      .increment('retry_count', 1)
      .update({ updated_at: new Date() });
  }

  static async getNotificationStats(dateFrom?: Date, dateTo?: Date): Promise<NotificationStats> {
    let query = db('scheduled_notifications');
    
    if (dateFrom) {
      query = query.where('created_at', '>=', dateFrom);
    }
    
    if (dateTo) {
      query = query.where('created_at', '<=', dateTo);
    }

    // Total de notificaciones
    const [totalResult] = await query.clone().count('* as count');
    const totalNotifications = parseInt(totalResult.count as string);

    // Estadísticas por estado
    const statusStats = await query.clone()
      .select('status')
      .count('* as count')
      .groupBy('status');

    const statusMap = statusStats.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count as string);
      return acc;
    }, {} as Record<string, number>);

    // Estadísticas por canal
    const channelStats = await query.clone()
      .select('channel', 'status')
      .count('* as count')
      .groupBy('channel', 'status');

    const channelMap = channelStats.reduce((acc, row) => {
      if (!acc[row.channel]) {
        acc[row.channel] = { total: 0, sent: 0, failed: 0, successRate: 0 };
      }
      const count = parseInt(row.count as string);
      acc[row.channel].total += count;
      if (row.status === 'sent') {
        acc[row.channel].sent += count;
      } else if (row.status === 'failed') {
        acc[row.channel].failed += count;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calcular tasas de éxito
    Object.keys(channelMap).forEach(channel => {
      const stats = channelMap[channel];
      stats.successRate = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;
    });

    // Estadísticas por tipo
    const typeStats = await query.clone()
      .select('type')
      .count('* as count')
      .groupBy('type');

    const typeMap: Record<NotificationType, number> = {
      appointment_reminder: 0,
      appointment_confirmation: 0,
      appointment_cancellation: 0,
      follow_up: 0,
      promotion: 0,
      birthday_greeting: 0,
      loyalty_reward: 0
    };

    typeStats.forEach(row => {
      const type = row.type as NotificationType;
      if (type in typeMap) {
        typeMap[type] = parseInt(row.count as string);
      }
    });

    const pendingNotifications = parseInt(String(statusMap.pending || 0));
    const sentNotifications = parseInt(String(statusMap.sent || 0));
    const failedNotifications = parseInt(String(statusMap.failed || 0));
    const successRate = totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0;

    return {
      totalNotifications,
      pendingNotifications,
      sentNotifications,
      failedNotifications,
      successRate,
      channelStats: {
        whatsapp: channelMap.whatsapp || { total: 0, sent: 0, failed: 0, successRate: 0 },
        email: channelMap.email || { total: 0, sent: 0, failed: 0, successRate: 0 },
        sms: channelMap.sms || { total: 0, sent: 0, failed: 0, successRate: 0 }
      },
      typeStats: typeMap
    };
  }

  static async scheduleAppointmentReminder(bookingId: string, clientId: string, scheduledFor: Date): Promise<ScheduledNotification> {
    return this.create({
      clientId,
      bookingId,
      type: 'appointment_reminder',
      channel: 'whatsapp', // Canal por defecto
      scheduledFor,
      templateName: 'appointment_reminder',
      templateData: { bookingId }
    });
  }

  static async scheduleAppointmentConfirmation(bookingId: string, clientId: string): Promise<ScheduledNotification> {
    // Enviar confirmación inmediatamente
    const now = new Date();
    
    return this.create({
      clientId,
      bookingId,
      type: 'appointment_confirmation',
      channel: 'whatsapp',
      scheduledFor: now,
      templateName: 'appointment_confirmation',
      templateData: { bookingId }
    });
  }

  static async cancelNotificationsForBooking(bookingId: string): Promise<void> {
    await db('scheduled_notifications')
      .where('booking_id', bookingId)
      .where('status', 'pending')
      .update({
        status: 'cancelled',
        updated_at: new Date()
      });
  }

  static async getUpcomingReminders(hours: number = 24): Promise<ScheduledNotification[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const notifications = await db('scheduled_notifications')
      .where('status', 'pending')
      .where('type', 'appointment_reminder')
      .where('scheduled_for', '>=', now)
      .where('scheduled_for', '<=', futureTime)
      .orderBy('scheduled_for', 'asc');

    return notifications.map(notification => this.formatNotification(notification));
  }

  private static formatNotification(dbNotification: any): ScheduledNotification {
    return {
      id: dbNotification.id,
      clientId: dbNotification.client_id,
      bookingId: dbNotification.booking_id,
      type: dbNotification.type,
      channel: dbNotification.channel,
      scheduledFor: new Date(dbNotification.scheduled_for),
      status: dbNotification.status,
      templateName: dbNotification.template_name,
      templateData: typeof dbNotification.template_data === 'string'
        ? JSON.parse(dbNotification.template_data)
        : (dbNotification.template_data || {}),
      createdAt: dbNotification.created_at,
      updatedAt: dbNotification.updated_at,
      sentAt: dbNotification.sent_at ? new Date(dbNotification.sent_at) : undefined,
      errorMessage: dbNotification.error_message,
      retryCount: dbNotification.retry_count || 0
    };
  }
}