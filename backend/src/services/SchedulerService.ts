import { NotificationService } from './NotificationService';
import { BookingService } from './BookingService';
import logger from '../utils/logger';

export class SchedulerService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  // Configuración por defecto
  private static config = {
    notificationProcessingInterval: 60000, // 1 minuto
    reminderSchedulingInterval: 300000,    // 5 minutos
    enabled: true
  };

  /**
   * Iniciar el servicio de programación automática
   */
  static start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler service is already running');
      return;
    }

    if (!this.config.enabled) {
      logger.info('Scheduler service is disabled');
      return;
    }

    logger.info('Starting scheduler service...');
    this.isRunning = true;

    // Procesar notificaciones pendientes cada minuto
    this.intervalId = setInterval(async () => {
      try {
        await this.processScheduledTasks();
      } catch (error) {
        logger.error('Error in scheduled task processing:', error);
      }
    }, this.config.notificationProcessingInterval);

    // Programar recordatorios para citas futuras cada 5 minutos
    setInterval(async () => {
      try {
        await this.scheduleUpcomingReminders();
      } catch (error) {
        logger.error('Error scheduling upcoming reminders:', error);
      }
    }, this.config.reminderSchedulingInterval);

    logger.info('Scheduler service started successfully');
  }

  /**
   * Detener el servicio de programación
   */
  static stop(): void {
    if (!this.isRunning) {
      logger.warn('Scheduler service is not running');
      return;
    }

    logger.info('Stopping scheduler service...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('Scheduler service stopped');
  }

  /**
   * Verificar si el servicio está ejecutándose
   */
  static getStatus(): { isRunning: boolean; config: typeof SchedulerService.config } {
    return {
      isRunning: this.isRunning,
      config: { ...this.config }
    };
  }

  /**
   * Actualizar configuración del servicio
   */
  static updateConfig(newConfig: Partial<typeof SchedulerService.config>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Scheduler configuration updated:', this.config);

    // Reiniciar si está ejecutándose y la configuración cambió
    if (this.isRunning && (newConfig.enabled === false)) {
      this.stop();
    } else if (!this.isRunning && newConfig.enabled === true) {
      this.start();
    }
  }

  /**
   * Procesar todas las tareas programadas
   */
  private static async processScheduledTasks(): Promise<void> {
    await Promise.all([
      this.processNotifications(),
      this.processBookingReminders(),
      this.processFollowUps(),
      this.processWhatsAppTemplates()
    ]);
  }

  /**
   * Procesar notificaciones pendientes
   */
  private static async processNotifications(): Promise<void> {
    try {
      await NotificationService.processPendingNotifications();
    } catch (error) {
      logger.error('Error processing pending notifications:', error);
    }
  }

  /**
   * Procesar recordatorios de citas
   */
  private static async processBookingReminders(): Promise<void> {
    try {
      // Obtener citas que necesitan recordatorios en las próximas 25 horas
      // (damos 1 hora de margen para asegurar que se programen a tiempo)
      const upcomingBookings = await BookingService.getUpcomingBookings(25);
      
      for (const booking of upcomingBookings) {
        try {
          // Verificar si ya tiene recordatorios programados
          const existingReminders = await NotificationService.getNotifications({
            bookingId: booking.id,
            type: 'appointment_reminder',
            status: 'pending'
          });

          // Si no tiene recordatorios pendientes, programar uno
          if (existingReminders.notifications.length === 0) {
            await NotificationService.scheduleAppointmentReminder(booking.id);
            logger.info(`Scheduled reminder for booking ${booking.id}`);
          }
        } catch (error) {
          logger.error(`Error scheduling reminder for booking ${booking.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing booking reminders:', error);
    }
  }

  /**
   * Procesar seguimientos post-tratamiento
   */
  private static async processFollowUps(): Promise<void> {
    try {
      // Obtener citas completadas en las últimas 24 horas que no tengan seguimiento
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      
      const completedBookings = await BookingService.getBookings({
        status: 'completed',
        dateFrom: yesterday,
        dateTo: new Date(),
        limit: 50
      });

      for (const booking of completedBookings.bookings) {
        try {
          // Verificar si ya tiene seguimiento programado
          const existingFollowUps = await NotificationService.getNotifications({
            bookingId: booking.id,
            type: 'follow_up',
            status: 'pending'
          });

          // Si no tiene seguimiento pendiente, programar uno
          if (existingFollowUps.notifications.length === 0) {
            await NotificationService.scheduleFollowUp(booking.id, 24);
            logger.info(`Scheduled follow-up for completed booking ${booking.id}`);
          }
        } catch (error) {
          logger.error(`Error scheduling follow-up for booking ${booking.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing follow-ups:', error);
    }
  }

  /**
   * Programar recordatorios para citas futuras
   */
  private static async scheduleUpcomingReminders(): Promise<void> {
    try {
      // Obtener citas confirmadas para los próximos 7 días
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingBookings = await BookingService.getBookings({
        status: 'confirmed',
        dateFrom: new Date(),
        dateTo: nextWeek,
        limit: 100
      });

      let scheduledCount = 0;

      for (const booking of upcomingBookings.bookings) {
        try {
          // Calcular cuándo debe enviarse el recordatorio (24h antes)
          const reminderTime = new Date(booking.dateTime);
          reminderTime.setHours(reminderTime.getHours() - 24);

          // Solo programar si el recordatorio debe enviarse en las próximas 2 horas
          const twoHoursFromNow = new Date();
          twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

          if (reminderTime <= twoHoursFromNow && reminderTime > new Date()) {
            // Verificar si ya tiene recordatorios programados
            const existingReminders = await NotificationService.getNotifications({
              bookingId: booking.id,
              type: 'appointment_reminder',
              status: 'pending'
            });

            if (existingReminders.notifications.length === 0) {
              await NotificationService.scheduleAppointmentReminder(booking.id);
              scheduledCount++;
            }
          }
        } catch (error) {
          logger.error(`Error scheduling reminder for booking ${booking.id}:`, error);
        }
      }

      if (scheduledCount > 0) {
        logger.info(`Scheduled ${scheduledCount} new appointment reminders`);
      }
    } catch (error) {
      logger.error('Error scheduling upcoming reminders:', error);
    }
  }

  /**
   * Ejecutar manualmente todas las tareas programadas
   */
  static async runManually(): Promise<{
    notificationsProcessed: boolean;
    remindersScheduled: boolean;
    followUpsScheduled: boolean;
  }> {
    const results = {
      notificationsProcessed: false,
      remindersScheduled: false,
      followUpsScheduled: false
    };

    try {
      await this.processNotifications();
      results.notificationsProcessed = true;
    } catch (error) {
      logger.error('Manual notification processing failed:', error);
    }

    try {
      await this.processBookingReminders();
      results.remindersScheduled = true;
    } catch (error) {
      logger.error('Manual reminder scheduling failed:', error);
    }

    try {
      await this.processFollowUps();
      results.followUpsScheduled = true;
    } catch (error) {
      logger.error('Manual follow-up scheduling failed:', error);
    }

    return results;
  }

  /**
   * Procesar plantillas de WhatsApp programadas
   */
  private static async processWhatsAppTemplates(): Promise<void> {
    try {
      const { WhatsAppTemplateService } = await import('./WhatsAppTemplateService');
      await WhatsAppTemplateService.processScheduledTemplates();
    } catch (error) {
      logger.error('Error processing WhatsApp templates:', error);
    }
  }

  /**
   * Obtener estadísticas del servicio
   */
  static async getStats(): Promise<{
    isRunning: boolean;
    config: typeof SchedulerService.config;
    upcomingReminders: number;
    pendingNotifications: number;
    scheduledTemplates: number;
    lastProcessingTime: Date;
  }> {
    const upcomingReminders = await NotificationService.getNotifications({
      type: 'appointment_reminder',
      status: 'pending',
      scheduledFrom: new Date(),
      limit: 1000
    });

    const pendingNotifications = await NotificationService.getNotifications({
      status: 'pending',
      limit: 1000
    });

    // Obtener plantillas programadas
    let scheduledTemplates = 0;
    try {
      const { WhatsAppTemplateService } = await import('./WhatsAppTemplateService');
      const templates = await WhatsAppTemplateService.getScheduledTemplates({
        status: 'pending',
        limit: 1000
      });
      scheduledTemplates = templates.total;
    } catch (error) {
      logger.error('Error getting scheduled templates stats:', error);
    }

    return {
      isRunning: this.isRunning,
      config: { ...this.config },
      upcomingReminders: upcomingReminders.total,
      pendingNotifications: pendingNotifications.total,
      scheduledTemplates,
      lastProcessingTime: new Date()
    };
  }
}