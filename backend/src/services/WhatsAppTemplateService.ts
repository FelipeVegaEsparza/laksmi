import { TwilioService } from './TwilioService';
import { ClientModel } from '../models/Client';
import { BookingModel } from '../models/Booking';
import { ServiceModel } from '../models/Service';
import logger from '../utils/logger';

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: 'appointment_reminder' | 'booking_confirmation' | 'follow_up' | 'promotion' | 'general';
  parameters: string[];
  description: string;
}

export interface TemplateData {
  clientName?: string;
  serviceName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  price?: string;
  duration?: string;
  professionalName?: string;
  confirmationCode?: string;
  customMessage?: string;
  careInstructions?: string;
  oldDate?: string;
  oldTime?: string;
  cancellationReason?: string;
  refundInfo?: string;
  paymentMethod?: string;
  nextRecommendedDate?: string;
  specialOffer?: string;
  reviewLink?: string;
  discountPercentage?: string;
  validUntil?: string;
  welcomeOffer?: string;
  birthdayOffer?: string;
  visitCount?: string;
  loyaltyReward?: string;
  rewardCode?: string;
}

export interface TemplateContent {
  [templateName: string]: string;
}

export interface ScheduledTemplate {
  id: string;
  templateName: string;
  clientId: string;
  bookingId?: string;
  scheduledFor: Date;
  templateData: TemplateData;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: Date;
  sentAt?: Date;
  errorMessage?: string;
  retryCount: number;
}

export class WhatsAppTemplateService {
  // Contenido de las plantillas de WhatsApp Business
  private static templateContents: TemplateContent = {
    // Recordatorios de citas
    'appointment_reminder_24h': `🔔 *Recordatorio de Cita*

¡Hola {{clientName}}! 👋

Te recordamos tu cita para mañana:

📅 *{{serviceName}}*
🕐 {{appointmentDate}} a las {{appointmentTime}}
👩‍⚕️ Con {{professionalName}}
📍 {{clinicName}}

Si necesitas hacer algún cambio, contáctanos al {{clinicPhone}}

¡Te esperamos! ✨`,

    'appointment_reminder_2h': `⏰ *Tu cita es en 2 horas*

¡Hola {{clientName}}!

Tu cita de *{{serviceName}}* es hoy a las {{appointmentTime}} con {{professionalName}}.

📍 Nos encontramos en: {{clinicAddress}}

¡Nos vemos pronto! 😊`,

    'appointment_reminder_custom': `🔔 *Recordatorio Personalizado*

¡Hola {{clientName}}!

{{customMessage}}

📅 *{{serviceName}}*
🕐 {{appointmentDate}} a las {{appointmentTime}}
👩‍⚕️ Con {{professionalName}}

¡Te esperamos! ✨`,

    // Confirmaciones de reserva
    'booking_confirmation': `✅ *¡Cita Confirmada!*

¡Hola {{clientName}}!

Tu cita ha sido confirmada exitosamente:

📅 *{{serviceName}}*
🕐 {{appointmentDate}} a las {{appointmentTime}}
👩‍⚕️ Con {{professionalName}}
⏱️ Duración: {{duration}} minutos
💰 Precio: €{{price}}

🎫 Código de confirmación: *{{confirmationCode}}*

Te enviaremos un recordatorio 24h antes.

¡Gracias por confiar en nosotros! 💖`,

    'booking_confirmation_payment': `✅ *¡Reserva y Pago Confirmados!*

¡Hola {{clientName}}!

Tu reserva y pago han sido procesados:

📅 *{{serviceName}}*
🕐 {{appointmentDate}} a las {{appointmentTime}}
💳 Método de pago: {{paymentMethod}}
💰 Total pagado: €{{price}}

🎫 Código: *{{confirmationCode}}*

¡Nos vemos pronto! 😊`,

    'booking_modification_confirmation': `🔄 *Cita Modificada*

¡Hola {{clientName}}!

Tu cita ha sido modificada exitosamente:

❌ Fecha anterior: {{oldDate}} a las {{oldTime}}
✅ Nueva fecha: {{appointmentDate}} a las {{appointmentTime}}

📅 Servicio: *{{serviceName}}*
🎫 Código: *{{confirmationCode}}*

¡Gracias por tu flexibilidad! 🙏`,

    'booking_cancellation_confirmation': `❌ *Cita Cancelada*

Hola {{clientName}},

Tu cita del {{appointmentDate}} a las {{appointmentTime}} para *{{serviceName}}* ha sido cancelada.

Motivo: {{cancellationReason}}

{{refundInfo}}

¿Te gustaría reagendar? Responde a este mensaje y te ayudamos a encontrar una nueva fecha.

Gracias por tu comprensión 🙏`,

    // Seguimientos post-tratamiento
    'follow_up_immediate': `💫 *Cuidados Post-Tratamiento*

¡Hola {{clientName}}!

Esperamos que hayas disfrutado tu *{{serviceName}}* con {{professionalName}}.

📋 *Instrucciones importantes:*
{{careInstructions}}

Si tienes alguna pregunta o molestia, no dudes en contactarnos.

¡Cuídate mucho! 💖`,

    'follow_up_24h': `💫 *¿Cómo te sientes?*

¡Hola {{clientName}}!

Han pasado 24 horas desde tu *{{serviceName}}* con {{professionalName}}.

¿Cómo te sientes? ¿Alguna pregunta sobre el cuidado posterior?

Tu bienestar es nuestra prioridad. ¡Responde cuando tengas un momento! 😊`,

    'follow_up_weekly': `🌟 *¡Es hora de tu próximo tratamiento!*

¡Hola {{clientName}}!

Ha pasado una semana desde tu *{{serviceName}}*. 

Para mantener los resultados óptimos, te recomendamos agendar tu próxima cita para el {{nextRecommendedDate}}.

🎁 *Oferta especial:* {{specialOffer}}

¿Te gustaría reservar? ¡Responde y te ayudamos! ✨`,

    'follow_up_satisfaction': `⭐ *Tu opinión nos importa*

¡Hola {{clientName}}!

Esperamos que hayas quedado encantada con tu *{{serviceName}}* con {{professionalName}}.

¿Nos ayudarías con una reseña? Tu experiencia ayuda a otras clientas:
{{reviewLink}}

¡Gracias por ser parte de nuestra familia! 💖`,

    // Promociones y mensajes especiales
    'promotion_monthly': `🎉 *¡Oferta Especial para Ti!*

¡Hola {{clientName}}!

{{customMessage}}

🎁 *{{discountPercentage}}% de descuento*
⏰ Válido hasta: {{validUntil}}

¡No te lo pierdas! Responde para reservar 😊`,

    'welcome_new_client': `🌟 *¡Bienvenida a {{clinicName}}!*

¡Hola {{clientName}}!

Nos emociona tenerte como parte de nuestra familia de belleza.

🎁 *Regalo de bienvenida:*
{{welcomeOffer}}

¡Esperamos verte pronto para tu primera experiencia con nosotros! 💖`,

    'birthday_special': `🎂 *¡Feliz Cumpleaños {{clientName}}!* 🎉

En tu día especial queremos regalarte algo único:

🎁 *{{birthdayOffer}}*
⏰ Válido hasta: {{validUntil}}

¡Ven a celebrar con nosotros y date el capricho que te mereces!

¡Felicidades! 🥳💖`,

    'loyalty_milestone': `🏆 *¡Felicidades por tu Fidelidad!*

¡Hola {{clientName}}!

¡Has completado {{visitCount}} visitas con nosotros! 🌟

🎁 *Has desbloqueado:*
{{loyaltyReward}}

Código: *{{rewardCode}}*

¡Gracias por ser parte de nuestra familia! 💖`
  };

  // Plantillas predefinidas del sistema
  private static templates: WhatsAppTemplate[] = [
    // Plantillas de recordatorios de citas
    {
      name: 'appointment_reminder_24h',
      language: 'es',
      category: 'appointment_reminder',
      parameters: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'professionalName', 'clinicName', 'clinicPhone'],
      description: 'Recordatorio de cita 24 horas antes'
    },
    {
      name: 'appointment_reminder_2h',
      language: 'es',
      category: 'appointment_reminder',
      parameters: ['clientName', 'serviceName', 'appointmentTime', 'professionalName', 'clinicAddress'],
      description: 'Recordatorio de cita 2 horas antes'
    },
    {
      name: 'appointment_reminder_custom',
      language: 'es',
      category: 'appointment_reminder',
      parameters: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'customMessage', 'professionalName'],
      description: 'Recordatorio personalizable de cita'
    },
    
    // Plantillas de confirmación de reserva
    {
      name: 'booking_confirmation',
      language: 'es',
      category: 'booking_confirmation',
      parameters: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'confirmationCode', 'professionalName', 'price', 'duration'],
      description: 'Confirmación de reserva de cita'
    },
    {
      name: 'booking_confirmation_payment',
      language: 'es',
      category: 'booking_confirmation',
      parameters: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'confirmationCode', 'price', 'paymentMethod'],
      description: 'Confirmación de reserva con información de pago'
    },
    {
      name: 'booking_modification_confirmation',
      language: 'es',
      category: 'booking_confirmation',
      parameters: ['clientName', 'serviceName', 'oldDate', 'oldTime', 'appointmentDate', 'appointmentTime', 'confirmationCode'],
      description: 'Confirmación de modificación de cita'
    },
    {
      name: 'booking_cancellation_confirmation',
      language: 'es',
      category: 'booking_confirmation',
      parameters: ['clientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'cancellationReason', 'refundInfo'],
      description: 'Confirmación de cancelación de cita'
    },
    
    // Plantillas de seguimiento post-tratamiento
    {
      name: 'follow_up_immediate',
      language: 'es',
      category: 'follow_up',
      parameters: ['clientName', 'serviceName', 'professionalName', 'careInstructions'],
      description: 'Seguimiento inmediato post-tratamiento'
    },
    {
      name: 'follow_up_24h',
      language: 'es',
      category: 'follow_up',
      parameters: ['clientName', 'serviceName', 'professionalName'],
      description: 'Seguimiento 24 horas después del tratamiento'
    },
    {
      name: 'follow_up_weekly',
      language: 'es',
      category: 'follow_up',
      parameters: ['clientName', 'serviceName', 'nextRecommendedDate', 'specialOffer'],
      description: 'Seguimiento semanal con recomendaciones'
    },
    {
      name: 'follow_up_satisfaction',
      language: 'es',
      category: 'follow_up',
      parameters: ['clientName', 'serviceName', 'professionalName', 'reviewLink'],
      description: 'Seguimiento para obtener feedback del cliente'
    },
    
    // Plantillas promocionales y generales
    {
      name: 'promotion_monthly',
      language: 'es',
      category: 'promotion',
      parameters: ['clientName', 'customMessage', 'discountPercentage', 'validUntil'],
      description: 'Promoción mensual personalizada'
    },
    {
      name: 'welcome_new_client',
      language: 'es',
      category: 'general',
      parameters: ['clientName', 'clinicName', 'welcomeOffer'],
      description: 'Bienvenida a cliente nuevo con oferta especial'
    },
    {
      name: 'birthday_special',
      language: 'es',
      category: 'promotion',
      parameters: ['clientName', 'birthdayOffer', 'validUntil'],
      description: 'Felicitación de cumpleaños con oferta especial'
    },
    {
      name: 'loyalty_milestone',
      language: 'es',
      category: 'promotion',
      parameters: ['clientName', 'visitCount', 'loyaltyReward', 'rewardCode'],
      description: 'Reconocimiento por fidelidad del cliente'
    }
  ];

  /**
   * Enviar recordatorio de cita 24h antes
   */
  static async sendAppointmentReminder(
    clientId: string,
    bookingId: string
  ): Promise<{
    success: boolean;
    messageSid?: string;
    error?: string;
  }> {
    try {
      // Obtener datos del cliente y la cita
      const client = await ClientModel.findById(clientId);
      const booking = await BookingModel.findById(bookingId);
      
      if (!client || !booking) {
        return {
          success: false,
          error: 'Cliente o cita no encontrados'
        };
      }

      const service = await ServiceModel.findById(booking.serviceId);
      
      const templateData: TemplateData = {
        clientName: client.name.split(' ')[0], // Solo primer nombre
        serviceName: service?.name || 'Servicio',
        appointmentDate: this.formatDate(booking.dateTime),
        appointmentTime: this.formatTime(booking.dateTime)
      };

      return await this.sendTemplate(
        client.phone,
        'appointment_reminder_24h',
        templateData
      );

    } catch (error: any) {
      logger.error('Error sending appointment reminder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar confirmación de reserva
   */
  static async sendBookingConfirmation(
    clientId: string,
    bookingId: string
  ): Promise<{
    success: boolean;
    messageSid?: string;
    error?: string;
  }> {
    try {
      const client = await ClientModel.findById(clientId);
      const booking = await BookingModel.findById(bookingId);
      
      if (!client || !booking) {
        return {
          success: false,
          error: 'Cliente o cita no encontrados'
        };
      }

      const service = await ServiceModel.findById(booking.serviceId);
      
      const templateData: TemplateData = {
        clientName: client.name.split(' ')[0],
        serviceName: service?.name || 'Servicio',
        appointmentDate: this.formatDate(booking.dateTime),
        appointmentTime: this.formatTime(booking.dateTime),
        confirmationCode: booking.id.substring(0, 8).toUpperCase()
      };

      return await this.sendTemplate(
        client.phone,
        'booking_confirmation',
        templateData
      );

    } catch (error: any) {
      logger.error('Error sending booking confirmation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar seguimiento post-tratamiento
   */
  static async sendFollowUp(
    clientId: string,
    serviceId: string,
    customMessage?: string
  ): Promise<{
    success: boolean;
    messageSid?: string;
    error?: string;
  }> {
    try {
      const client = await ClientModel.findById(clientId);
      const service = await ServiceModel.findById(serviceId);
      
      if (!client || !service) {
        return {
          success: false,
          error: 'Cliente o servicio no encontrados'
        };
      }

      const templateData: TemplateData = {
        clientName: client.name.split(' ')[0],
        serviceName: service.name,
        customMessage: customMessage || 'Esperamos que hayas disfrutado tu experiencia'
      };

      return await this.sendTemplate(
        client.phone,
        'appointment_follow_up',
        templateData
      );

    } catch (error: any) {
      logger.error('Error sending follow-up:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar promoción personalizada
   */
  static async sendPromotion(
    clientId: string,
    promotionMessage: string
  ): Promise<{
    success: boolean;
    messageSid?: string;
    error?: string;
  }> {
    try {
      const client = await ClientModel.findById(clientId);
      
      if (!client) {
        return {
          success: false,
          error: 'Cliente no encontrado'
        };
      }

      const templateData: TemplateData = {
        clientName: client.name.split(' ')[0],
        customMessage: promotionMessage
      };

      return await this.sendTemplate(
        client.phone,
        'promotion_monthly',
        templateData
      );

    } catch (error: any) {
      logger.error('Error sending promotion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar bienvenida a cliente nuevo
   */
  static async sendWelcomeMessage(
    clientId: string
  ): Promise<{
    success: boolean;
    messageSid?: string;
    error?: string;
  }> {
    try {
      const client = await ClientModel.findById(clientId);
      
      if (!client) {
        return {
          success: false,
          error: 'Cliente no encontrado'
        };
      }

      const templateData: TemplateData = {
        clientName: client.name.split(' ')[0],
        clinicName: 'Clínica de Belleza'
      };

      return await this.sendTemplate(
        client.phone,
        'welcome_new_client',
        templateData
      );

    } catch (error: any) {
      logger.error('Error sending welcome message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar plantilla genérica
   */
  static async sendTemplate(
    phoneNumber: string,
    templateName: string,
    templateData: TemplateData
  ): Promise<{
    success: boolean;
    messageSid?: string;
    error?: string;
  }> {
    try {
      // Verificar que la plantilla existe
      const template = this.templates.find(t => t.name === templateName);
      if (!template) {
        return {
          success: false,
          error: `Plantilla '${templateName}' no encontrada`
        };
      }

      // Preparar datos de la plantilla
      const processedData: Record<string, string> = {};
      
      template.parameters.forEach(param => {
        const value = templateData[param as keyof TemplateData];
        processedData[param] = value || '';
      });

      // Enviar plantilla vía Twilio
      const result = await TwilioService.sendWhatsAppTemplate(
        phoneNumber,
        templateName,
        processedData
      );

      if (result.success) {
        logger.info(`WhatsApp template sent successfully: ${templateName}`, {
          phoneNumber,
          templateName,
          messageSid: result.messageSid
        });
      }

      return result;

    } catch (error: any) {
      logger.error('Error sending WhatsApp template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener plantillas disponibles
   */
  static getAvailableTemplates(): WhatsAppTemplate[] {
    return [...this.templates];
  }

  /**
   * Obtener plantilla por nombre
   */
  static getTemplate(templateName: string): WhatsAppTemplate | null {
    return this.templates.find(t => t.name === templateName) || null;
  }

  /**
   * Agregar nueva plantilla
   */
  static addTemplate(template: WhatsAppTemplate): void {
    // Verificar que no existe una plantilla con el mismo nombre
    const existingTemplate = this.templates.find(t => t.name === template.name);
    if (existingTemplate) {
      throw new Error(`Template '${template.name}' already exists`);
    }

    this.templates.push(template);
    logger.info(`New WhatsApp template added: ${template.name}`);
  }

  /**
   * Actualizar plantilla existente
   */
  static updateTemplate(templateName: string, updates: Partial<WhatsAppTemplate>): boolean {
    const templateIndex = this.templates.findIndex(t => t.name === templateName);
    if (templateIndex === -1) {
      return false;
    }

    this.templates[templateIndex] = { ...this.templates[templateIndex], ...updates };
    logger.info(`WhatsApp template updated: ${templateName}`);
    return true;
  }

  /**
   * Eliminar plantilla
   */
  static removeTemplate(templateName: string): boolean {
    const templateIndex = this.templates.findIndex(t => t.name === templateName);
    if (templateIndex === -1) {
      return false;
    }

    this.templates.splice(templateIndex, 1);
    logger.info(`WhatsApp template removed: ${templateName}`);
    return true;
  }

  // Métodos de utilidad privados

  private static formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private static formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Validar datos de plantilla
   */
  static validateTemplateData(templateName: string, data: TemplateData): {
    isValid: boolean;
    missingParameters: string[];
  } {
    const template = this.getTemplate(templateName);
    if (!template) {
      return {
        isValid: false,
        missingParameters: ['Template not found']
      };
    }

    const missingParameters: string[] = [];
    
    template.parameters.forEach(param => {
      const value = data[param as keyof TemplateData];
      if (!value || value.trim().length === 0) {
        missingParameters.push(param);
      }
    });

    return {
      isValid: missingParameters.length === 0,
      missingParameters
    };
  }

  /**
   * Obtener estadísticas de uso de plantillas
   */
  static getTemplateStats(): {
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    templatesWithMostParameters: WhatsAppTemplate[];
  } {
    const templatesByCategory: Record<string, number> = {};
    
    this.templates.forEach(template => {
      templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1;
    });

    const templatesWithMostParameters = [...this.templates]
      .sort((a, b) => b.parameters.length - a.parameters.length)
      .slice(0, 3);

    return {
      totalTemplates: this.templates.length,
      templatesByCategory,
      templatesWithMostParameters
    };
  }

  // ========== SISTEMA DE PLANTILLAS PROGRAMADAS ==========

  /**
   * Programar envío de plantilla
   */
  static async scheduleTemplate(
    templateName: string,
    clientId: string,
    scheduledFor: Date,
    templateData: TemplateData,
    bookingId?: string
  ): Promise<{
    success: boolean;
    scheduledId?: string;
    error?: string;
  }> {
    try {
      // Verificar que la plantilla existe
      const template = this.getTemplate(templateName);
      if (!template) {
        return {
          success: false,
          error: `Plantilla '${templateName}' no encontrada`
        };
      }

      // Validar datos de la plantilla
      const validation = this.validateTemplateData(templateName, templateData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Faltan parámetros requeridos: ${validation.missingParameters.join(', ')}`
        };
      }

      // Verificar que el cliente existe
      const client = await ClientModel.findById(clientId);
      if (!client) {
        return {
          success: false,
          error: 'Cliente no encontrado'
        };
      }

      // Crear notificación programada usando el NotificationService
      const NotificationService = (await import('./NotificationService')).NotificationService;
      
      const notification = await NotificationService.createNotification({
        clientId,
        bookingId,
        type: this.mapCategoryToNotificationType(template.category),
        channel: 'whatsapp',
        scheduledFor,
        templateName,
        templateData
      });

      logger.info(`Template scheduled successfully: ${templateName} for client ${clientId}`, {
        scheduledId: notification.id,
        scheduledFor,
        templateName
      });

      return {
        success: true,
        scheduledId: notification.id
      };

    } catch (error: any) {
      logger.error('Error scheduling template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancelar plantilla programada
   */
  static async cancelScheduledTemplate(scheduledId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const NotificationService = (await import('./NotificationService')).NotificationService;
      await NotificationService.cancelNotification(scheduledId);

      logger.info(`Scheduled template cancelled: ${scheduledId}`);
      
      return { success: true };

    } catch (error: any) {
      logger.error('Error cancelling scheduled template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener plantillas programadas
   */
  static async getScheduledTemplates(filters: {
    clientId?: string;
    bookingId?: string;
    templateName?: string;
    status?: 'pending' | 'sent' | 'failed' | 'cancelled';
    scheduledFrom?: Date;
    scheduledTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    templates: ScheduledTemplate[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const NotificationService = (await import('./NotificationService')).NotificationService;
      
      const result = await NotificationService.getNotifications({
        clientId: filters.clientId,
        bookingId: filters.bookingId,
        channel: 'whatsapp',
        status: filters.status,
        scheduledFrom: filters.scheduledFrom,
        scheduledTo: filters.scheduledTo,
        page: filters.page,
        limit: filters.limit
      });

      // Filtrar por nombre de plantilla si se especifica
      let filteredNotifications = result.notifications;
      if (filters.templateName) {
        filteredNotifications = result.notifications.filter(
          notification => notification.templateName === filters.templateName
        );
      }

      const templates: ScheduledTemplate[] = filteredNotifications.map(notification => ({
        id: notification.id,
        templateName: notification.templateName,
        clientId: notification.clientId,
        bookingId: notification.bookingId,
        scheduledFor: notification.scheduledFor,
        templateData: notification.templateData,
        status: notification.status,
        createdAt: notification.createdAt,
        sentAt: notification.sentAt,
        errorMessage: notification.errorMessage,
        retryCount: notification.retryCount
      }));

      return {
        templates,
        total: filters.templateName ? filteredNotifications.length : result.total,
        page: result.page,
        totalPages: result.totalPages
      };

    } catch (error: any) {
      logger.error('Error getting scheduled templates:', error);
      return {
        templates: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Procesar plantillas programadas pendientes
   */
  static async processScheduledTemplates(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    try {
      const NotificationService = (await import('./NotificationService')).NotificationService;
      await NotificationService.processPendingNotifications();

      // Obtener estadísticas de procesamiento
      const stats = await NotificationService.getNotificationStats();
      
      return {
        processed: stats.totalNotifications,
        successful: stats.sentNotifications,
        failed: stats.failedNotifications
      };

    } catch (error: any) {
      logger.error('Error processing scheduled templates:', error);
      return {
        processed: 0,
        successful: 0,
        failed: 0
      };
    }
  }

  /**
   * Obtener contenido renderizado de plantilla
   */
  static renderTemplateContent(templateName: string, templateData: TemplateData): string {
    const content = this.templateContents[templateName];
    if (!content) {
      throw new Error(`Contenido de plantilla no encontrado: ${templateName}`);
    }

    let rendered = content;
    
    // Reemplazar variables en formato {{variable}}
    Object.keys(templateData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const value = templateData[key as keyof TemplateData];
      rendered = rendered.replace(regex, String(value || ''));
    });

    return rendered;
  }

  /**
   * Previsualizar plantilla con datos
   */
  static previewTemplate(templateName: string, templateData: TemplateData): {
    success: boolean;
    content?: string;
    missingParameters?: string[];
    error?: string;
  } {
    try {
      const template = this.getTemplate(templateName);
      if (!template) {
        return {
          success: false,
          error: `Plantilla '${templateName}' no encontrada`
        };
      }

      const validation = this.validateTemplateData(templateName, templateData);
      if (!validation.isValid) {
        return {
          success: false,
          missingParameters: validation.missingParameters
        };
      }

      const content = this.renderTemplateContent(templateName, templateData);
      
      return {
        success: true,
        content
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== MÉTODOS DE UTILIDAD PRIVADOS ==========

  /**
   * Mapear categoría de plantilla a tipo de notificación
   */
  private static mapCategoryToNotificationType(category: string): any {
    const mapping: Record<string, string> = {
      'appointment_reminder': 'appointment_reminder',
      'booking_confirmation': 'appointment_confirmation',
      'follow_up': 'follow_up',
      'promotion': 'promotion',
      'general': 'promotion'
    };

    return mapping[category] || 'promotion';
  }

  /**
   * Obtener plantillas por categoría
   */
  static getTemplatesByCategory(category: string): WhatsAppTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Obtener contenido de plantilla
   */
  static getTemplateContent(templateName: string): string | null {
    return this.templateContents[templateName] || null;
  }

  /**
   * Actualizar contenido de plantilla
   */
  static updateTemplateContent(templateName: string, content: string): boolean {
    if (!this.templates.find(t => t.name === templateName)) {
      return false;
    }

    this.templateContents[templateName] = content;
    logger.info(`Template content updated: ${templateName}`);
    return true;
  }

  /**
   * Obtener todas las plantillas con su contenido
   */
  static getAllTemplatesWithContent(): Array<WhatsAppTemplate & { content: string }> {
    return this.templates.map(template => ({
      ...template,
      content: this.templateContents[template.name] || ''
    }));
  }
}