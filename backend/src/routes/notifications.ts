import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticateToken, requireAnyRole, requireManagerOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createNotificationSchema, updateNotificationSchema } from '../middleware/notificationValidation';

const router = Router();

// Rutas públicas para plantillas
/**
 * @route GET /api/v1/notifications/templates
 * @desc Obtener plantillas de notificación disponibles
 * @access Public
 */
router.get('/templates', NotificationController.getTemplates);

/**
 * @route GET /api/v1/notifications/templates/:templateName
 * @desc Obtener plantilla específica por nombre
 * @access Public
 */
router.get('/templates/:templateName', NotificationController.getTemplate);

// Aplicar autenticación a todas las rutas siguientes
router.use(authenticateToken);
router.use(requireAnyRole);

// Rutas de gestión de notificaciones (requieren autenticación)
/**
 * @route POST /api/v1/notifications
 * @desc Crear nueva notificación programada
 * @access Private (Any role)
 */
router.post('/', validateRequest(createNotificationSchema), NotificationController.createNotification);

/**
 * @route GET /api/v1/notifications
 * @desc Obtener notificaciones con filtros
 * @access Private (Any role)
 */
router.get('/', NotificationController.getNotifications);

/**
 * @route GET /api/v1/notifications/stats
 * @desc Obtener estadísticas de notificaciones
 * @access Private (Any role)
 */
router.get('/stats', NotificationController.getNotificationStats);

/**
 * @route GET /api/v1/notifications/:id
 * @desc Obtener notificación por ID
 * @access Private (Any role)
 */
router.get('/:id', NotificationController.getNotificationById);

/**
 * @route PUT /api/v1/notifications/:id
 * @desc Actualizar notificación
 * @access Private (Any role)
 */
router.put('/:id', validateRequest(updateNotificationSchema), NotificationController.updateNotification);

/**
 * @route PATCH /api/v1/notifications/:id/cancel
 * @desc Cancelar notificación
 * @access Private (Any role)
 */
router.patch('/:id/cancel', NotificationController.cancelNotification);

// Rutas específicas para recordatorios de citas
/**
 * @route POST /api/v1/notifications/bookings/:bookingId/reminder
 * @desc Programar recordatorio para una cita
 * @access Private (Any role)
 */
router.post('/bookings/:bookingId/reminder', NotificationController.scheduleAppointmentReminder);

/**
 * @route POST /api/v1/notifications/bookings/:bookingId/confirmation
 * @desc Programar confirmación para una cita
 * @access Private (Any role)
 */
router.post('/bookings/:bookingId/confirmation', NotificationController.scheduleAppointmentConfirmation);

/**
 * @route POST /api/v1/notifications/bookings/:bookingId/follow-up
 * @desc Programar seguimiento para una cita
 * @access Private (Any role)
 */
router.post('/bookings/:bookingId/follow-up', NotificationController.scheduleFollowUp);

/**
 * @route DELETE /api/v1/notifications/bookings/:bookingId
 * @desc Cancelar todas las notificaciones de una cita
 * @access Private (Any role)
 */
router.delete('/bookings/:bookingId', NotificationController.cancelBookingNotifications);

// Rutas administrativas (requieren permisos de manager o admin)
router.use(requireManagerOrAdmin);

/**
 * @route POST /api/v1/notifications/process
 * @desc Procesar manualmente notificaciones pendientes
 * @access Private (Manager/Admin)
 */
router.post('/process', NotificationController.processPendingNotifications);

export default router;