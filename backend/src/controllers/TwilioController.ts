import { Request, Response } from 'express';
import { TwilioService, TwilioWebhookPayload } from '../services/TwilioService';
import { WhatsAppMessageProcessor } from '../services/WhatsAppMessageProcessor';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class TwilioController {
  /**
   * Webhook para recibir mensajes de WhatsApp
   */
  static async webhookReceive(req: Request, res: Response): Promise<void> {
    try {
      logger.info('📨 Webhook received from Twilio', {
        from: req.body.From,
        to: req.body.To,
        body: req.body.Body,
        messageSid: req.body.MessageSid,
        headers: {
          signature: req.headers['x-twilio-signature'],
          contentType: req.headers['content-type']
        }
      });

      const payload: TwilioWebhookPayload = req.body;
      
      // Procesar mensaje con el nuevo procesador especializado
      logger.info('🔄 Processing message with WhatsAppMessageProcessor...');
      const result = await WhatsAppMessageProcessor.processIncomingMessage(payload);
      
      logger.info('✅ Message processed', {
        success: result.success,
        hasResponse: !!result.response,
        clientId: result.clientId,
        conversationId: result.conversationId
      });

      // Responder con TwiML XML según la documentación de Twilio
      if (result.success && result.response) {
        logger.info('✅ Sending TwiML response with message', {
          messageLength: result.response.length,
          clientId: result.clientId,
          conversationId: result.conversationId
        });

        // Generar TwiML response usando el SDK de Twilio
        const MessagingResponse = require('twilio').twiml.MessagingResponse;
        const twiml = new MessagingResponse();
        twiml.message(result.response);

        // Responder con TwiML XML
        res.type('text/xml');
        res.status(200).send(twiml.toString());
      } else {
        logger.warn('⚠️  No response generated, sending empty TwiML');
        
        // Si no hay respuesta, enviar TwiML vacío
        const MessagingResponse = require('twilio').twiml.MessagingResponse;
        const twiml = new MessagingResponse();
        
        res.type('text/xml');
        res.status(200).send(twiml.toString());
      }

    } catch (error: any) {
      logger.error('❌ Webhook processing error:', error);
      
      // Incluso en caso de error, responder con TwiML vacío
      const MessagingResponse = require('twilio').twiml.MessagingResponse;
      const twiml = new MessagingResponse();
      
      res.type('text/xml');
      res.status(200).send(twiml.toString());
    }
  }

  /**
   * Webhook para actualizaciones de estado de mensajes
   */
  static async webhookStatus(req: Request, res: Response): Promise<void> {
    try {
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

      logger.info('Message status update received', {
        messageSid: MessageSid,
        status: MessageStatus,
        errorCode: ErrorCode,
        errorMessage: ErrorMessage
      });

      // Aquí se podría actualizar el estado en la base de datos
      // Por ahora solo registramos en logs

      // Responder con TwiML vacío según la documentación
      const MessagingResponse = require('twilio').twiml.MessagingResponse;
      const twiml = new MessagingResponse();
      
      res.type('text/xml');
      res.status(200).send(twiml.toString());

    } catch (error: any) {
      logger.error('Status webhook processing error:', error);
      
      // Responder con TwiML vacío incluso en error
      const MessagingResponse = require('twilio').twiml.MessagingResponse;
      const twiml = new MessagingResponse();
      
      res.type('text/xml');
      res.status(200).send(twiml.toString());
    }
  }

  /**
   * Enviar mensaje de WhatsApp manualmente
   */
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { to, message, mediaUrl } = req.body;

      if (!to || !message) {
        res.status(400).json({
          success: false,
          error: 'Número de teléfono y mensaje son requeridos'
        });
        return;
      }

      const result = await TwilioService.sendWhatsAppMessage({
        to,
        body: message,
        mediaUrl
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'Mensaje enviado exitosamente',
          data: { messageSid: result.messageSid }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      logger.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar mensaje'
      });
    }
  }

  /**
   * Enviar plantilla de WhatsApp
   */
  static async sendTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { to, templateName, templateData } = req.body;

      if (!to || !templateName) {
        res.status(400).json({
          success: false,
          error: 'Número de teléfono y nombre de plantilla son requeridos'
        });
        return;
      }

      const result = await TwilioService.sendWhatsAppTemplate(
        to,
        templateName,
        templateData || {}
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Plantilla enviada exitosamente',
          data: { messageSid: result.messageSid }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      logger.error('Send template error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar plantilla'
      });
    }
  }

  /**
   * Obtener estado de mensaje
   */
  static async getMessageStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageSid } = req.params;

      const status = await TwilioService.getMessageStatus(messageSid);

      if (status) {
        res.json({
          success: true,
          message: 'Estado obtenido exitosamente',
          data: status
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Mensaje no encontrado'
        });
      }
    } catch (error: any) {
      logger.error('Get message status error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estado'
      });
    }
  }

  /**
   * Obtener plantillas disponibles
   */
  static async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templates = await TwilioService.getAvailableTemplates();

      res.json({
        success: true,
        message: 'Plantillas obtenidas exitosamente',
        data: templates
      });
    } catch (error: any) {
      logger.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener plantillas'
      });
    }
  }

  /**
   * Probar conexión con Twilio
   */
  static async testConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await TwilioService.testConnection();

      if (result.success) {
        res.json({
          success: true,
          message: 'Conexión exitosa con Twilio',
          data: result.accountInfo
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      logger.error('Test connection error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al probar conexión'
      });
    }
  }

  /**
   * Obtener configuración de Twilio
   */
  static async getConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = TwilioService.getConfig();

      res.json({
        success: true,
        message: 'Configuración obtenida exitosamente',
        data: config
      });
    } catch (error: any) {
      logger.error('Get config error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener configuración'
      });
    }
  }

  /**
   * Actualizar configuración de Twilio
   */
  static async updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { accountSid, authToken, phoneNumber, webhookUrl, validateSignatures } = req.body;

      TwilioService.updateConfig({
        accountSid,
        authToken,
        phoneNumber,
        webhookUrl,
        validateSignatures
      });

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente'
      });
    } catch (error: any) {
      logger.error('Update config error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar configuración'
      });
    }
  }

  /**
   * Obtener estadísticas de uso
   */
  static async getUsageStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = TwilioService.getUsageStats();

      res.json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get usage stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Limpiar rate limits expirados
   */
  static async cleanupRateLimits(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const cleanedCount = TwilioService.cleanupRateLimits();

      res.json({
        success: true,
        message: 'Limpieza completada exitosamente',
        data: { cleanedRateLimits: cleanedCount }
      });
    } catch (error: any) {
      logger.error('Cleanup rate limits error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en la limpieza'
      });
    }
  }

  /**
   * Obtener estadísticas de procesamiento de mensajes
   */
  static async getProcessingStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = WhatsAppMessageProcessor.getProcessingStats();

      res.json({
        success: true,
        message: 'Estadísticas de procesamiento obtenidas exitosamente',
        data: stats
      });
    } catch (error: any) {
      logger.error('Get processing stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Limpiar archivos multimedia antiguos
   */
  static async cleanupOldMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { daysOld = 30 } = req.body;
      
      const result = await WhatsAppMessageProcessor.cleanupOldMedia(daysOld);

      res.json({
        success: true,
        message: 'Limpieza de archivos completada exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Cleanup old media error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error en la limpieza de archivos'
      });
    }
  }

  /**
   * Identificar cliente por número de teléfono
   */
  static async identifyClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.params;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          error: 'Número de teléfono es requerido'
        });
        return;
      }

      const result = await WhatsAppMessageProcessor.identifyOrCreateClient(phoneNumber);

      res.json({
        success: true,
        message: 'Cliente identificado exitosamente',
        data: {
          client: result.client,
          isNewClient: result.isNewClient
        }
      });
    } catch (error: any) {
      logger.error('Identify client error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al identificar cliente'
      });
    }
  }

  /**
   * Obtener contexto de conversación
   */
  static async getConversationContext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;

      if (!clientId) {
        res.status(400).json({
          success: false,
          error: 'ID de cliente es requerido'
        });
        return;
      }

      const context = await WhatsAppMessageProcessor.retrieveConversationContext(clientId);

      res.json({
        success: true,
        message: 'Contexto de conversación obtenido exitosamente',
        data: context
      });
    } catch (error: any) {
      logger.error('Get conversation context error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener contexto'
      });
    }
  }

  /**
   * Obtener analíticas de conversaciones
   */
  static async getConversationAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, forceRefresh } = req.query;
      
      const dateFromParsed = dateFrom ? new Date(dateFrom as string) : undefined;
      const dateToParsed = dateTo ? new Date(dateTo as string) : undefined;
      const forceRefreshBool = forceRefresh === 'true';

      const { WhatsAppConversationLogger } = await import('../services/WhatsAppConversationLogger');
      const analytics = await WhatsAppConversationLogger.getConversationAnalytics(
        dateFromParsed,
        dateToParsed,
        forceRefreshBool
      );

      res.json({
        success: true,
        message: 'Analíticas obtenidas exitosamente',
        data: analytics
      });
    } catch (error: any) {
      logger.error('Get conversation analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener analíticas'
      });
    }
  }

  /**
   * Buscar conversaciones
   */
  static async searchConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { phoneNumber, intent, escalated, dateFrom, dateTo, hasMedia } = req.query;
      
      const criteria = {
        phoneNumber: phoneNumber as string,
        intent: intent as string,
        escalated: escalated === 'true' ? true : escalated === 'false' ? false : undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        hasMedia: hasMedia === 'true' ? true : hasMedia === 'false' ? false : undefined
      };

      const { WhatsAppConversationLogger } = await import('../services/WhatsAppConversationLogger');
      const conversations = await WhatsAppConversationLogger.searchConversations(criteria);

      res.json({
        success: true,
        message: 'Conversaciones encontradas exitosamente',
        data: conversations
      });
    } catch (error: any) {
      logger.error('Search conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar conversaciones'
      });
    }
  }

  /**
   * Exportar conversaciones a CSV
   */
  static async exportConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo } = req.query;
      
      const dateFromParsed = dateFrom ? new Date(dateFrom as string) : undefined;
      const dateToParsed = dateTo ? new Date(dateTo as string) : undefined;

      const { WhatsAppConversationLogger } = await import('../services/WhatsAppConversationLogger');
      const csvContent = await WhatsAppConversationLogger.exportConversationsToCSV(
        dateFromParsed,
        dateToParsed
      );

      const filename = `whatsapp-conversations-${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);

    } catch (error: any) {
      logger.error('Export conversations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al exportar conversaciones'
      });
    }
  }

  /**
   * Obtener historial de conversación de cliente
   */
  static async getClientConversationHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;
      const { limit = 50 } = req.query;

      if (!clientId) {
        res.status(400).json({
          success: false,
          error: 'ID de cliente es requerido'
        });
        return;
      }

      const { WhatsAppConversationLogger } = await import('../services/WhatsAppConversationLogger');
      const history = await WhatsAppConversationLogger.getClientConversationHistory(
        clientId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        message: 'Historial obtenido exitosamente',
        data: history
      });
    } catch (error: any) {
      logger.error('Get client conversation history error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener historial'
      });
    }
  }

  // ========== GESTIÓN DE PLANTILLAS WHATSAPP ==========

  /**
   * Obtener todas las plantillas de WhatsApp con contenido
   */
  static async getWhatsAppTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { category } = req.query;

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      
      let templates;
      if (category) {
        templates = WhatsAppTemplateService.getTemplatesByCategory(category as string);
      } else {
        templates = WhatsAppTemplateService.getAllTemplatesWithContent();
      }

      res.json({
        success: true,
        message: 'Plantillas obtenidas exitosamente',
        data: {
          templates,
          stats: WhatsAppTemplateService.getTemplateStats()
        }
      });
    } catch (error: any) {
      logger.error('Get WhatsApp templates error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener plantillas'
      });
    }
  }

  /**
   * Obtener plantilla específica por nombre
   */
  static async getWhatsAppTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { templateName } = req.params;

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const template = WhatsAppTemplateService.getTemplate(templateName);
      const content = WhatsAppTemplateService.getTemplateContent(templateName);

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Plantilla obtenida exitosamente',
        data: {
          ...template,
          content
        }
      });
    } catch (error: any) {
      logger.error('Get WhatsApp template error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener plantilla'
      });
    }
  }

  /**
   * Previsualizar plantilla con datos
   */
  static async previewTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { templateName } = req.params;
      const { templateData } = req.body;

      if (!templateData) {
        res.status(400).json({
          success: false,
          error: 'Datos de plantilla son requeridos'
        });
        return;
      }

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const preview = WhatsAppTemplateService.previewTemplate(templateName, templateData);

      if (!preview.success) {
        res.status(400).json({
          success: false,
          error: preview.error,
          missingParameters: preview.missingParameters
        });
        return;
      }

      res.json({
        success: true,
        message: 'Vista previa generada exitosamente',
        data: {
          content: preview.content,
          templateName,
          templateData
        }
      });
    } catch (error: any) {
      logger.error('Preview template error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al generar vista previa'
      });
    }
  }

  /**
   * Programar envío de plantilla
   */
  static async scheduleTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { templateName, clientId, scheduledFor, templateData, bookingId } = req.body;

      if (!templateName || !clientId || !scheduledFor || !templateData) {
        res.status(400).json({
          success: false,
          error: 'Nombre de plantilla, ID de cliente, fecha programada y datos son requeridos'
        });
        return;
      }

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const result = await WhatsAppTemplateService.scheduleTemplate(
        templateName,
        clientId,
        new Date(scheduledFor),
        templateData,
        bookingId
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Plantilla programada exitosamente',
        data: {
          scheduledId: result.scheduledId,
          templateName,
          clientId,
          scheduledFor: new Date(scheduledFor)
        }
      });
    } catch (error: any) {
      logger.error('Schedule template error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al programar plantilla'
      });
    }
  }

  /**
   * Cancelar plantilla programada
   */
  static async cancelScheduledTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { scheduledId } = req.params;

      if (!scheduledId) {
        res.status(400).json({
          success: false,
          error: 'ID de plantilla programada es requerido'
        });
        return;
      }

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const result = await WhatsAppTemplateService.cancelScheduledTemplate(scheduledId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Plantilla programada cancelada exitosamente',
        data: { scheduledId }
      });
    } catch (error: any) {
      logger.error('Cancel scheduled template error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al cancelar plantilla programada'
      });
    }
  }

  /**
   * Obtener plantillas programadas
   */
  static async getScheduledTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { 
        clientId, 
        bookingId, 
        templateName, 
        status, 
        scheduledFrom, 
        scheduledTo, 
        page = 1, 
        limit = 10 
      } = req.query;

      const filters = {
        clientId: clientId as string,
        bookingId: bookingId as string,
        templateName: templateName as string,
        status: status as 'pending' | 'sent' | 'failed' | 'cancelled',
        scheduledFrom: scheduledFrom ? new Date(scheduledFrom as string) : undefined,
        scheduledTo: scheduledTo ? new Date(scheduledTo as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const result = await WhatsAppTemplateService.getScheduledTemplates(filters);

      res.json({
        success: true,
        message: 'Plantillas programadas obtenidas exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Get scheduled templates error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener plantillas programadas'
      });
    }
  }

  /**
   * Procesar plantillas programadas pendientes manualmente
   */
  static async processScheduledTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const result = await WhatsAppTemplateService.processScheduledTemplates();

      res.json({
        success: true,
        message: 'Plantillas programadas procesadas exitosamente',
        data: result
      });
    } catch (error: any) {
      logger.error('Process scheduled templates error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al procesar plantillas programadas'
      });
    }
  }

  /**
   * Enviar recordatorio de cita
   */
  static async sendAppointmentReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId, bookingId } = req.body;

      if (!clientId || !bookingId) {
        res.status(400).json({
          success: false,
          error: 'ID de cliente y ID de cita son requeridos'
        });
        return;
      }

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const result = await WhatsAppTemplateService.sendAppointmentReminder(clientId, bookingId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Recordatorio de cita enviado exitosamente',
        data: {
          messageSid: result.messageSid,
          clientId,
          bookingId
        }
      });
    } catch (error: any) {
      logger.error('Send appointment reminder error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar recordatorio'
      });
    }
  }

  /**
   * Enviar confirmación de reserva
   */
  static async sendBookingConfirmation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId, bookingId } = req.body;

      if (!clientId || !bookingId) {
        res.status(400).json({
          success: false,
          error: 'ID de cliente y ID de cita son requeridos'
        });
        return;
      }

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const result = await WhatsAppTemplateService.sendBookingConfirmation(clientId, bookingId);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Confirmación de reserva enviada exitosamente',
        data: {
          messageSid: result.messageSid,
          clientId,
          bookingId
        }
      });
    } catch (error: any) {
      logger.error('Send booking confirmation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar confirmación'
      });
    }
  }

  /**
   * Enviar seguimiento post-tratamiento
   */
  static async sendFollowUp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { clientId, serviceId, customMessage } = req.body;

      if (!clientId || !serviceId) {
        res.status(400).json({
          success: false,
          error: 'ID de cliente y ID de servicio son requeridos'
        });
        return;
      }

      const { WhatsAppTemplateService } = await import('../services/WhatsAppTemplateService');
      const result = await WhatsAppTemplateService.sendFollowUp(clientId, serviceId, customMessage);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Seguimiento enviado exitosamente',
        data: {
          messageSid: result.messageSid,
          clientId,
          serviceId
        }
      });
    } catch (error: any) {
      logger.error('Send follow-up error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al enviar seguimiento'
      });
    }
  }
}