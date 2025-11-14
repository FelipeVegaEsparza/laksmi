import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { authenticateToken, requireAnyRole, requireManagerOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createBookingSchema, updateBookingSchema, createProfessionalSchema, updateProfessionalSchema } from '../middleware/bookingValidation';

const router = Router();

// Rutas públicas para consulta de disponibilidad
/**
 * @route GET /api/v1/bookings/availability
 * @desc Consultar disponibilidad de servicios
 * @access Public
 */
router.get('/availability', BookingController.getAvailability);

/**
 * @route GET /api/v1/bookings/professionals/service/:serviceId
 * @desc Obtener profesionales que pueden realizar un servicio
 * @access Public
 */
router.get('/professionals/service/:serviceId', BookingController.getProfessionalsByService);

/**
 * @route GET /api/v1/bookings/professionals
 * @desc Obtener lista de profesionales activos
 * @access Public
 */
router.get('/professionals', BookingController.getProfessionals);

/**
 * @route POST /api/v1/bookings/public
 * @desc Crear nueva cita desde el frontend público
 * @access Public
 */
router.post('/public', validateRequest(createBookingSchema), BookingController.createBooking);

// Aplicar autenticación a todas las rutas siguientes
router.use(authenticateToken);
router.use(requireAnyRole);

// Rutas de gestión de citas (requieren autenticación)
/**
 * @route POST /api/v1/bookings
 * @desc Crear nueva cita
 * @access Private (Any role)
 */
router.post('/', validateRequest(createBookingSchema), BookingController.createBooking);

/**
 * @route GET /api/v1/bookings
 * @desc Obtener citas con filtros
 * @access Private (Any role)
 */
router.get('/', BookingController.getBookings);

/**
 * @route GET /api/v1/bookings/stats
 * @desc Obtener estadísticas de citas
 * @access Private (Any role)
 */
router.get('/stats', BookingController.getBookingStats);

/**
 * @route GET /api/v1/bookings/today
 * @desc Obtener citas de hoy
 * @access Private (Any role)
 */
router.get('/today', BookingController.getTodayBookings);

/**
 * @route GET /api/v1/bookings/upcoming
 * @desc Obtener próximas citas
 * @access Private (Any role)
 */
router.get('/upcoming', BookingController.getUpcomingBookings);

/**
 * @route GET /api/v1/bookings/client/:clientId
 * @desc Obtener historial de citas de un cliente
 * @access Private (Any role)
 */
router.get('/client/:clientId', BookingController.getClientBookings);

/**
 * @route GET /api/v1/bookings/:id
 * @desc Obtener cita por ID
 * @access Private (Any role)
 */
router.get('/:id', BookingController.getBookingById);

/**
 * @route PUT /api/v1/bookings/:id
 * @desc Actualizar cita
 * @access Private (Any role)
 */
router.put('/:id', validateRequest(updateBookingSchema), BookingController.updateBooking);

/**
 * @route PATCH /api/v1/bookings/:id/cancel
 * @desc Cancelar cita
 * @access Private (Any role)
 */
router.patch('/:id/cancel', BookingController.cancelBooking);

/**
 * @route PATCH /api/v1/bookings/:id/complete
 * @desc Marcar cita como completada
 * @access Private (Any role)
 */
router.patch('/:id/complete', BookingController.markCompleted);

/**
 * @route PATCH /api/v1/bookings/:id/no-show
 * @desc Marcar cita como no show
 * @access Private (Any role)
 */
router.patch('/:id/no-show', BookingController.markNoShow);

/**
 * @route DELETE /api/v1/bookings/:id
 * @desc Eliminar cita
 * @access Private (Any role)
 */
router.delete('/:id', BookingController.deleteBooking);

// Rutas de gestión de profesionales (requieren permisos de manager o admin)
router.use(requireManagerOrAdmin);

/**
 * @route POST /api/v1/bookings/professionals
 * @desc Crear nuevo profesional
 * @access Private (Manager/Admin)
 */
router.post('/professionals', validateRequest(createProfessionalSchema), BookingController.createProfessional);

/**
 * @route GET /api/v1/bookings/professionals/:id
 * @desc Obtener profesional por ID
 * @access Private (Manager/Admin)
 */
router.get('/professionals/:id', BookingController.getProfessionalById);

/**
 * @route PUT /api/v1/bookings/professionals/:id
 * @desc Actualizar profesional
 * @access Private (Manager/Admin)
 */
router.put('/professionals/:id', validateRequest(updateProfessionalSchema), BookingController.updateProfessional);

/**
 * @route DELETE /api/v1/bookings/professionals/:id
 * @desc Eliminar profesional
 * @access Private (Manager/Admin)
 */
router.delete('/professionals/:id', BookingController.deleteProfessional);

/**
 * @route PATCH /api/v1/bookings/professionals/:id/toggle
 * @desc Activar/desactivar profesional
 * @access Private (Manager/Admin)
 */
router.patch('/professionals/:id/toggle', BookingController.toggleProfessionalStatus);

export default router;