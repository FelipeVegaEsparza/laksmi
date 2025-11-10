import { NotificationModel } from '../models/Notification';
import { BookingModel } from '../models/Booking';
import { ClientModel } from '../models/Client';
import { ServiceModel } from '../models/Service';
import { ProfessionalModel } from '../models/Professional';
import { 
  ScheduledNotification, 
  CreateNotificationRequest, 
  UpdateNotificationRequest, 
  NotificationFilters,
  NotificationTemplate,
  NotificationStats,
  SendNotificationRequest,
  SendNotificationResponse,
  NotificationChannel,
  NotificationType,
  ReminderConfig
} from '../types/notification';
import logger from '../utils/logger';

export class NotificationService {
  // Configuración por defecto para recordatorios
  private static defaultReminderConfig: ReminderConfig = {
    enabled: true,
    hoursBeforeAppointment: 24,
    channels: ['whatsapp'],
    templateName: 'appointment_reminder',
    retryAttempts: 3,
    retryIntervalMinutes: 30
  };

  // Plantillas de notificación predefinidas
  private static templates: Record<string, NotificationTemplate> = {
    appointment_reminder: {
      name: 'appointment_reminder',
      type: 'appointment_reminder',
      channel: 'whatsapp',
      content: 'Hola {{clientName}}! 👋\n\nTe recordamos tu cita para mañana:\n\n🗓️ **{{serviceName}}**\n⏰ {{appointmentDate}} a las {{appointmentTime}}\n👩‍⚕️ Con {{professionalName}}\n\n¿Necesitas hacer algún cambio? Responde a este mensaje.\n\n¡Te esperamos! ✨',
      variables: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'professionalName'],
      isActive: true
    },
    appointment_confirmation: {
      name: 'appointment_confirmation',
      type: 'appointment_confirmation',
      channel: 'whatsapp',
      content: '✅ **Cita Confirmada**\n\nHola {{clientName}}!\n\nTu cita ha sido confirmada:\n\n🗓️ **{{serviceName}}**\n⏰ {{appointmentDate}} a las {{appointmentTime}}\n👩‍⚕️ Con {{professionalName}}\n💰 Precio: €{{servicePrice}}\n\nTe enviaremos un recordatorio 24h antes.\n\n¡Gracias por confiar en nosotros! 💖',
      variables: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'professionalName', 'servicePrice'],
      isActive: true
    },
    appointment_cancellation: {
      name: 'appointment_cancellation',
      type: 'appointment_cancellation',
      channel: 'whatsapp',
      content: '❌ **Cita Cancelada**\n\nHola {{clientName}},\n\nTu cita del {{appointmentDate}} a las {{appointmentTime}} para {{serviceName}} ha sido cancelada.\n\n{{cancellationReason}}\n\n¿Te gustaría reagendar? Responde a este mensaje y te ayudamos a encontrar una nueva fecha.\n\nGracias por tu comprensión 🙏',
      variables: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'cancellationReason'],
      isActive: true
    },
    follow_up: {
      name: 'follow_up',
      type: 'follow_up',
      channel: 'whatsapp',
      content: '💫 **¿Cómo te fue?**\n\nHola {{clientName}}!\n\nEsperamos que hayas disfrutado tu {{serviceName}} con {{professionalName}}.\n\n¿Cómo te sientes? ¿Alguna pregunta sobre el cuidado posterior?\n\nTu opinión es muy importante para nosotros. ¡Responde cuando tengas un momento! 😊',
      variables: ['clientName', 'serviceName', 'professionalName'],
      isActive: true
    },
    birthday_greeting: {
      name: 'birthday_greeting',
      type: 'birthday_greeting',
      channel: 'whatsapp',
      content: '🎉 **¡Feliz Cumpleaños!** 🎂\n\n¡Hola {{clientName}}!\n\nEn tu día especial queremos regalarte algo especial:\n\n🎁 **20% de descuento** en cualquier tratamiento\n✨ Válido hasta el {{expirationDate}}\n\n¡Ven a celebrar con nosotros y date el capricho que te mereces!\n\n¡Felicidades! 🥳💖',
      variables: ['clientName', 'expirationDate'],
      isActive: true
    },
    loyalty_reward: {
      name: 'loyalty_reward',
      type: 'loyalty_reward',
      channel: 'whatsapp',
      content: '🏆 **¡Felicidades!**\n\nHola {{clientName}}!\n\nHas alcanzado {{loyaltyPoints}} puntos de fidelidad. 🌟\n\n🎁 **Has desbloqueado:**\n{{rewardDescription}}\n\nCódigo: {{rewardCode}}\nVálido hasta: {{expirationDate}}\n\n¡Gracias por ser parte de nuestra familia! 💖',
      variables: ['clientName', 'loyaltyPoints', 'rewardDescription', 'rewardCode', 'expirationDate'],
      isActive: true
    }
  };

  // Gestión de notificaciones programadas
  static async createNotification(notificationData: CreateNotificationRequest): Promise<ScheduledNotification> {
    // Validar que el cliente existe
    const client = await ClientModel.findById(notificationData.clientId);
    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    // Validar que la plantilla existe
    const template = this.templates[notificationData.templateName];
    if (!template) {
      throw new Error(`Plantilla no encontrada: ${notificationData.templateName}`);
    }

    // Validar que el canal coincide con la plantilla
    if (template.channel !== notificationData.channel) {
      throw new Error(`La plantilla ${notificationData.templateName} no es compatible con el canal ${notificationData.channel}`);
    }

    const notification = await NotificationModel.create(notificationData);
    logger.info(`Notification scheduled: ${notification.id} for client ${notification.clientId}`);
    
    return notification;
  }

  static async updateNotification(id: string, updates: UpdateNotificationRequest): Promise<ScheduledNotification> {
    const existingNotification = await NotificationModel.findById(id);
    if (!existingNotification) {
      throw new Error('Notificación no encontrada');
    }

    // No permitir actualizar notificaciones ya enviadas
    if (existingNotification.status === 'sent') {
      throw new Error('No se pueden modificar notificaciones ya enviadas');
    }

    const updatedNotification = await NotificationModel.update(id, updates);
    if (!updatedNotification) {
      throw new Error('Error al actualizar la notificación');
    }

    logger.info(`Notification updated: ${updatedNotification.id}`);
    return updatedNotification;
  }

  static async getNotification(id: string): Promise<ScheduledNotification> {
    const notification = await NotificationModel.findById(id);
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }
    return notification;
  }

  static async getNotifications(filters: NotificationFilters = {}): Promise<{ notifications: ScheduledNotification[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 10 } = filters;
    const result = await NotificationModel.findAll(filters);
    
    return {
      ...result,
      page,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  static async cancelNotification(id: string): Promise<ScheduledNotification> {
    const notification = await NotificationModel.findById(id);
    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    if (notification.status === 'sent') {
      throw new Error('No se puede cancelar una notificación ya enviada');
    }

    const cancelledNotification = await NotificationModel.update(id, {
      status: 'cancelled'
    });

    if (!cancelledNotification) {
      throw new Error('Error al cancelar la notificación');
    }

    logger.info(`Notification cancelled: ${cancelledNotification.id}`);
    return cancelledNotification;
  }

  static async getNotificationStats(dateFrom?: Date, dateTo?: Date): Promise<NotificationStats> {
    return await NotificationModel.getNotificationStats(dateFrom, dateTo);
  }

  // Gestión de recordatorios de citas
  static async scheduleAppointmentReminder(bookingId: string, config?: Partial<ReminderConfig>): Promise<ScheduledNotification[]> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new Error('Cita no encontrada');
    }

    const reminderConfig = { ...this.defaultReminderConfig, ...config };
    
    if (!reminderConfig.enabled) {
      logger.info(`Reminders disabled for booking ${bookingId}`);
      return [];
    }

    // Calcular cuándo enviar el recordatorio
    const reminderTime = new Date(booking.dateTime);
    reminderTime.setHours(reminderTime.getHours() - reminderConfig.hoursBeforeAppointment);

    // No programar recordatorios para el pasado
    if (reminderTime <= new Date()) {
      logger.warn(`Cannot schedule reminder for past time: ${reminderTime}`);
      return [];
    }

    const notifications: ScheduledNotification[] = [];

    // Crear recordatorios para cada canal configurado
    for (const channel of reminderConfig.channels) {
      try {
        const templateData = await this.buildAppointmentTemplateData(bookingId);
        
        const notification = await this.createNotification({
          clientId: booking.clientId,
          bookingId: booking.id,
          type: 'appointment_reminder',
          channel,
          scheduledFor: reminderTime,
          templateName: reminderConfig.templateName,
          templateData
        });

        notifications.push(notification);
      } catch (error) {
        logger.error(`Error scheduling reminder for channel ${channel}:`, error);
      }
    }

    logger.info(`Scheduled ${notifications.length} reminders for booking ${bookingId}`);
    return notifications;
  }

  static async scheduleAppointmentConfirmation(bookingId: string): Promise<ScheduledNotification> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new Error('Cita no encontrada');
    }

    const templateData = await this.buildAppointmentTemplateData(bookingId);
    
    // Enviar confirmación inmediatamente
    const notification = await this.createNotification({
      clientId: booking.clientId,
      bookingId: booking.id,
      type: 'appointment_confirmation',
      channel: 'whatsapp',
      scheduledFor: new Date(),
      templateName: 'appointment_confirmation',
      templateData
    });

    logger.info(`Scheduled confirmation for booking ${bookingId}`);
    return notification;
  }

  static async scheduleFollowUp(bookingId: string, hoursAfter: number = 24): Promise<ScheduledNotification> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new Error('Cita no encontrada');
    }

    // Calcular cuándo enviar el seguimiento
    const followUpTime = new Date(booking.dateTime);
    followUpTime.setHours(followUpTime.getHours() + booking.duration / 60 + hoursAfter);

    const templateData = await this.buildAppointmentTemplateData(bookingId);
    
    const notification = await this.createNotification({
      clientId: booking.clientId,
      bookingId: booking.id,
      type: 'follow_up',
      channel: 'whatsapp',
      scheduledFor: followUpTime,
      templateName: 'follow_up',
      templateData
    });

    logger.info(`Scheduled follow-up for booking ${bookingId}`);
    return notification;
  }

  static async cancelBookingNotifications(bookingId: string): Promise<void> {
    await NotificationModel.cancelNotificationsForBooking(bookingId);
    logger.info(`Cancelled notifications for booking ${bookingId}`);
  }

  // Procesamiento de notificaciones pendientes
  static async processPendingNotifications(): Promise<void> {
    const pendingNotifications = await NotificationModel.getPendingNotifications(50);
    
    logger.info(`Processing ${pendingNotifications.length} pending notifications`);

    for (const notification of pendingNotifications) {
      try {
        await this.processNotification(notification);
      } catch (error) {
        logger.error(`Error processing notification ${notification.id}:`, error);
        
        // Incrementar contador de reintentos
        await NotificationModel.incrementRetryCount(notification.id);
        
        // Marcar como fallida si se exceden los reintentos
        if (notification.retryCount >= 2) { // 3 intentos total
          await NotificationModel.markAsFailed(notification.id, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }
  }

  private static async processNotification(notification: ScheduledNotification): Promise<void> {
    const template = this.templates[notification.templateName];
    if (!template) {
      throw new Error(`Template not found: ${notification.templateName}`);
    }

    // Obtener datos del cliente
    const client = await ClientModel.findById(notification.clientId);
    if (!client) {
      throw new Error(`Client not found: ${notification.clientId}`);
    }

    // Renderizar el contenido de la plantilla
    const content = this.renderTemplate(template.content, notification.templateData);

    // Simular envío (aquí se integraría con Twilio, servicio de email, etc.)
    const response = await this.simulateSend(notification.channel, client.phone, content);

    if (response.success) {
      await NotificationModel.markAsSent(notification.id, response.externalId);
      logger.info(`Notification sent successfully: ${notification.id}`);
    } else {
      throw new Error(response.message);
    }
  }

  private static async buildAppointmentTemplateData(bookingId: string): Promise<Record<string, any>> {
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const [client, service, professional] = await Promise.all([
      ClientModel.findById(booking.clientId),
      ServiceModel.findById(booking.serviceId),
      booking.professionalId ? ProfessionalModel.findById(booking.professionalId) : null
    ]);

    if (!client || !service) {
      throw new Error('Missing booking data');
    }

    const appointmentDate = booking.dateTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const appointmentTime = booking.dateTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      clientName: client.name,
      serviceName: service.name,
      servicePrice: service.price.toFixed(2),
      appointmentDate,
      appointmentTime,
      professionalName: professional?.name || 'Nuestro equipo',
      bookingId: booking.id
    };
  }

  private static renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    // Reemplazar variables en formato {{variable}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(data[key] || ''));
    });

    return rendered;
  }

  private static async simulateSend(channel: NotificationChannel, to: string, content: string): Promise<SendNotificationResponse> {
    // Simulación del envío - aquí se integraría con los proveedores reales
    logger.info(`Simulating ${channel} send to ${to}: ${content.substring(0, 50)}...`);
    
    // Simular un pequeño delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      message: 'Message sent successfully',
      externalId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  // Métodos de utilidad
  static getTemplate(templateName: string): NotificationTemplate | null {
    return this.templates[templateName] || null;
  }

  static getAllTemplates(): NotificationTemplate[] {
    return Object.values(this.templates);
  }

  static getTemplatesByType(type: NotificationType): NotificationTemplate[] {
    return Object.values(this.templates).filter(template => template.type === type);
  }

  static getTemplatesByChannel(channel: NotificationChannel): NotificationTemplate[] {
    return Object.values(this.templates).filter(template => template.channel === channel);
  }
}