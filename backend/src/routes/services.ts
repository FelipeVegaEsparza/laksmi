import { Router } from 'express';
import { ServiceController } from '../controllers/ServiceController';
import { authenticateToken, requireAnyRole, requireManagerOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { createServiceSchema, updateServiceSchema } from '../middleware/serviceValidation';

const router = Router();

/**
 * @route GET /api/v1/services/public
 * @desc Obtener servicios activos (acceso público)
 * @access Public
 */
router.get('/public', ServiceController.getActiveServices);

/**
 * @route GET /api/v1/services/public/:id
 * @desc Obtener servicio por ID (acceso público)
 * @access Public
 */
router.get('/public/:id', ServiceController.getServiceById);

/**
 * @route GET /api/v1/services/public/category/:category
 * @desc Obtener servicios por categoría (acceso público)
 * @access Public
 */
router.get('/public/category/:category', ServiceController.getServicesByCategory);

/**
 * @route GET /api/v1/services/categories
 * @desc Obtener categorías disponibles (acceso público)
 * @access Public
 */
router.get('/categories', ServiceController.getCategories);

/**
 * @route GET /api/v1/services/popular
 * @desc Obtener servicios populares (acceso público)
 * @access Public
 */
router.get('/popular', ServiceController.getPopularServices);

/**
 * @route GET /api/v1/services/search
 * @desc Buscar servicios (acceso público)
 * @access Public
 */
router.get('/search', ServiceController.searchServices);

// Rutas que requieren autenticación
router.use(authenticateToken);
router.use(requireAnyRole);

/**
 * @route GET /api/v1/services
 * @desc Obtener todos los servicios con filtros (incluye inactivos)
 * @access Private (Any role)
 */
router.get('/', ServiceController.getServices);

/**
 * @route GET /api/v1/services/stats
 * @desc Obtener estadísticas de servicios
 * @access Private (Any role)
 */
router.get('/stats', ServiceController.getServiceStats);

/**
 * @route GET /api/v1/services/:id
 * @desc Obtener servicio por ID (incluye inactivos)
 * @access Private (Any role)
 */
router.get('/:id', ServiceController.getServiceById);

// Rutas que requieren permisos de manager o admin
router.use(requireManagerOrAdmin);

/**
 * @route POST /api/v1/services
 * @desc Crear nuevo servicio
 * @access Private (Manager/Admin)
 */
router.post('/', validateRequest(createServiceSchema), ServiceController.createService);

/**
 * @route PUT /api/v1/services/:id
 * @desc Actualizar servicio
 * @access Private (Manager/Admin)
 */
router.put('/:id', validateRequest(updateServiceSchema), ServiceController.updateService);

/**
 * @route DELETE /api/v1/services/:id
 * @desc Eliminar servicio
 * @access Private (Manager/Admin)
 */
router.delete('/:id', ServiceController.deleteService);

/**
 * @route PATCH /api/v1/services/:id/toggle
 * @desc Activar/desactivar servicio
 * @access Private (Manager/Admin)
 */
router.patch('/:id/toggle', ServiceController.toggleServiceStatus);

export default router;