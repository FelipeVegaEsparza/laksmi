import { Router } from 'express';
import { TwilioController } from '../controllers/TwilioController';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  validateTwilioWebhook, 
  logTwilioWebhook, 
  rateLimitTwilioWebhook,
  handleTwilioWebhookError 
} from '../middleware/twilioWebhook';
import { webhookRateLimit } from '../middleware/security';
import { 
  sendMessageSchema, 
  sendTemplateSchema, 
  updateTwilioConfigSchema,
  previewTemplateSchema,
  scheduleTemplateSchema,
  sendAppointmentReminderSchema,
  sendBookingConfirmationSchema,
  sendFollowUpSchema,
  scheduledTemplatesFiltersSchema
} from '../middleware/twilioValidation';

const router = Router();

// Webhooks públicos (sin autenticación, validados por signature de Twilio)
/**
 * @route POST /api/v1/twilio/webhook/receive
 * @desc Webhook para recibir mensajes de WhatsApp
 * @access Public (validated by Twilio signature)
 */
router.post('/webhook/receive', 
  webhookRateLimit,
  rateLimitTwilioWebhook,
  logTwilioWebhook,
  validateTwilioWebhook,
  TwilioController.webhookReceive,
  handleTwilioWebhookError
);

/**
 * @route POST /api/v1/twilio/webhook/status
 * @desc Webhook para actualizaciones de estado de mensajes
 * @access Public (validated by Twilio signature)
 */
router.post('/webhook/status',
  webhookRateLimit,
  rateLimitTwilioWebhook,
  logTwilioWebhook,
  validateTwilioWebhook,
  TwilioController.webhookStatus,
  handleTwilioWebhookError
);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

/**
 * @route POST /api/v1/twilio/send-message
 * @desc Enviar mensaje de WhatsApp manualmente
 * @access Private (Any authenticated user)
 */
router.post('/send-message', validateRequest(sendMessageSchema), TwilioController.sendMessage);

/**
 * @route POST /api/v1/twilio/send-template
 * @desc Enviar plantilla de WhatsApp
 * @access Private (Any authenticated user)
 */
router.post('/send-template', validateRequest(sendTemplateSchema), TwilioController.sendTemplate);

/**
 * @route GET /api/v1/twilio/message/:messageSid/status
 * @desc Obtener estado de mensaje específico
 * @access Private (Any authenticated user)
 */
router.get('/message/:messageSid/status', TwilioController.getMessageStatus);

/**
 * @route GET /api/v1/twilio/templates
 * @desc Obtener plantillas disponibles
 * @access Private (Any authenticated user)
 */
router.get('/templates', TwilioController.getTemplates);

/**
 * @route GET /api/v1/twilio/stats
 * @desc Obtener estadísticas de uso
 * @access Private (Any authenticated user)
 */
router.get('/stats', TwilioController.getUsageStats);

// Rutas administrativas (requieren permisos de manager o admin)
router.use(requireManagerOrAdmin);

/**
 * @route GET /api/v1/twilio/test-connection
 * @desc Probar conexión con Twilio
 * @access Private (Manager/Admin)
 */
router.get('/test-connection', TwilioController.testConnection);

/**
 * @route GET /api/v1/twilio/config
 * @desc Obtener configuración de Twilio
 * @access Private (Manager/Admin)
 */
router.get('/config', TwilioController.getConfig);

/**
 * @route PUT /api/v1/twilio/config
 * @desc Actualizar configuración de Twilio
 * @access Private (Manager/Admin)
 */
router.put('/config', validateRequest(updateTwilioConfigSchema), TwilioController.updateConfig);

/**
 * @route POST /api/v1/twilio/cleanup-rate-limits
 * @desc Limpiar rate limits expirados
 * @access Private (Manager/Admin)
 */
router.post('/cleanup-rate-limits', TwilioController.cleanupRateLimits);

/**
 * @route GET /api/v1/twilio/processing-stats
 * @desc Obtener estadísticas de procesamiento de mensajes
 * @access Private (Manager/Admin)
 */
router.get('/processing-stats', TwilioController.getProcessingStats);

/**
 * @route POST /api/v1/twilio/cleanup-media
 * @desc Limpiar archivos multimedia antiguos
 * @access Private (Manager/Admin)
 */
router.post('/cleanup-media', TwilioController.cleanupOldMedia);

/**
 * @route GET /api/v1/twilio/identify-client/:phoneNumber
 * @desc Identificar cliente por número de teléfono
 * @access Private (Manager/Admin)
 */
router.get('/identify-client/:phoneNumber', TwilioController.identifyClient);

/**
 * @route GET /api/v1/twilio/conversation-context/:clientId
 * @desc Obtener contexto de conversación de cliente
 * @access Private (Manager/Admin)
 */
router.get('/conversation-context/:clientId', TwilioController.getConversationContext);

/**
 * @route GET /api/v1/twilio/analytics
 * @desc Obtener analíticas de conversaciones
 * @access Private (Manager/Admin)
 */
router.get('/analytics', TwilioController.getConversationAnalytics);

/**
 * @route GET /api/v1/twilio/search-conversations
 * @desc Buscar conversaciones por criterios
 * @access Private (Manager/Admin)
 */
router.get('/search-conversations', TwilioController.searchConversations);

/**
 * @route GET /api/v1/twilio/export-conversations
 * @desc Exportar conversaciones a CSV
 * @access Private (Manager/Admin)
 */
router.get('/export-conversations', TwilioController.exportConversations);

/**
 * @route GET /api/v1/twilio/client-history/:clientId
 * @desc Obtener historial de conversación de cliente específico
 * @access Private (Manager/Admin)
 */
router.get('/client-history/:clientId', TwilioController.getClientConversationHistory);

// ========== RUTAS DE PLANTILLAS WHATSAPP ==========

/**
 * @route GET /api/v1/twilio/whatsapp-templates
 * @desc Obtener todas las plantillas de WhatsApp
 * @access Private (Manager/Admin)
 */
router.get('/whatsapp-templates', TwilioController.getWhatsAppTemplates);

/**
 * @route GET /api/v1/twilio/whatsapp-templates/:templateName
 * @desc Obtener plantilla específica por nombre
 * @access Private (Manager/Admin)
 */
router.get('/whatsapp-templates/:templateName', TwilioController.getWhatsAppTemplate);

/**
 * @route POST /api/v1/twilio/whatsapp-templates/:templateName/preview
 * @desc Previsualizar plantilla con datos
 * @access Private (Manager/Admin)
 */
router.post('/whatsapp-templates/:templateName/preview', validateRequest(previewTemplateSchema), TwilioController.previewTemplate);

/**
 * @route POST /api/v1/twilio/schedule-template
 * @desc Programar envío de plantilla
 * @access Private (Manager/Admin)
 */
router.post('/schedule-template', validateRequest(scheduleTemplateSchema), TwilioController.scheduleTemplate);

/**
 * @route DELETE /api/v1/twilio/scheduled-templates/:scheduledId
 * @desc Cancelar plantilla programada
 * @access Private (Manager/Admin)
 */
router.delete('/scheduled-templates/:scheduledId', TwilioController.cancelScheduledTemplate);

/**
 * @route GET /api/v1/twilio/scheduled-templates
 * @desc Obtener plantillas programadas
 * @access Private (Manager/Admin)
 */
router.get('/scheduled-templates', TwilioController.getScheduledTemplates);

/**
 * @route POST /api/v1/twilio/process-scheduled-templates
 * @desc Procesar plantillas programadas pendientes manualmente
 * @access Private (Manager/Admin)
 */
router.post('/process-scheduled-templates', TwilioController.processScheduledTemplates);

/**
 * @route POST /api/v1/twilio/send-appointment-reminder
 * @desc Enviar recordatorio de cita
 * @access Private (Manager/Admin)
 */
router.post('/send-appointment-reminder', validateRequest(sendAppointmentReminderSchema), TwilioController.sendAppointmentReminder);

/**
 * @route POST /api/v1/twilio/send-booking-confirmation
 * @desc Enviar confirmación de reserva
 * @access Private (Manager/Admin)
 */
router.post('/send-booking-confirmation', validateRequest(sendBookingConfirmationSchema), TwilioController.sendBookingConfirmation);

/**
 * @route POST /api/v1/twilio/send-follow-up
 * @desc Enviar seguimiento post-tratamiento
 * @access Private (Manager/Admin)
 */
router.post('/send-follow-up', validateRequest(sendFollowUpSchema), TwilioController.sendFollowUp);

export default router;