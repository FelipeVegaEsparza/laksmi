import { Router } from 'express';
import { EscalationController } from '../controllers/EscalationController';
import { authenticateToken, requireAnyRole, requireManagerOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { escalateConversationSchema, assignAgentSchema, resolveEscalationSchema } from '../middleware/escalationValidation';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAnyRole);

// Rutas de gestión de escalaciones (requieren autenticación)
/**
 * @route GET /api/v1/escalations
 * @desc Obtener escalaciones activas con filtros
 * @access Private (Any role)
 */
router.get('/', EscalationController.getActiveEscalations);

/**
 * @route GET /api/v1/escalations/my
 * @desc Obtener escalaciones asignadas al usuario actual
 * @access Private (Any role)
 */
router.get('/my', EscalationController.getMyEscalations);

/**
 * @route GET /api/v1/escalations/stats
 * @desc Obtener estadísticas de escalaciones
 * @access Private (Any role)
 */
router.get('/stats', EscalationController.getEscalationStats);

/**
 * @route GET /api/v1/escalations/:escalationId
 * @desc Obtener detalles de escalación específica
 * @access Private (Any role)
 */
router.get('/:escalationId', EscalationController.getEscalationDetails);

/**
 * @route POST /api/v1/escalations/conversation/:conversationId
 * @desc Escalar conversación manualmente
 * @access Private (Any role)
 */
router.post('/conversation/:conversationId', validateRequest(escalateConversationSchema), EscalationController.escalateConversation);

/**
 * @route POST /api/v1/escalations/:escalationId/assign
 * @desc Asignar agente humano a escalación
 * @access Private (Any role)
 */
router.post('/:escalationId/assign', validateRequest(assignAgentSchema), EscalationController.assignHumanAgent);

/**
 * @route POST /api/v1/escalations/:escalationId/take-control
 * @desc Tomar control de una escalación
 * @access Private (Any role)
 */
router.post('/:escalationId/take-control', EscalationController.takeControl);

/**
 * @route POST /api/v1/escalations/:escalationId/resolve
 * @desc Resolver escalación
 * @access Private (Any role)
 */
router.post('/:escalationId/resolve', validateRequest(resolveEscalationSchema), EscalationController.resolveEscalation);

// Rutas administrativas (requieren permisos de manager o admin)
router.use(requireManagerOrAdmin);

/**
 * @route POST /api/v1/escalations/cleanup
 * @desc Limpiar escalaciones antiguas
 * @access Private (Manager/Admin)
 */
router.post('/cleanup', EscalationController.cleanupOldEscalations);

/**
 * @route GET /api/v1/escalations/config
 * @desc Obtener configuración de escalación
 * @access Private (Manager/Admin)
 */
router.get('/config', EscalationController.getConfig);

/**
 * @route PUT /api/v1/escalations/config
 * @desc Actualizar configuración de escalación
 * @access Private (Manager/Admin)
 */
router.put('/config', EscalationController.updateConfig);

/**
 * @route GET /api/v1/escalations/system/status
 * @desc Obtener estado completo del sistema de escalación
 * @access Private (Manager/Admin)
 */
router.get('/system/status', EscalationController.getSystemStatus);

export default router;