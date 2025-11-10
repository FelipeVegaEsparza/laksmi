import { Router } from 'express';
import { HumanTakeoverController } from '../controllers/HumanTakeoverController';
import { authenticateToken, requireAnyRole, requireManagerOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { 
  startTakeoverSchema, 
  sendMessageSchema, 
  endTakeoverSchema, 
  transferControlSchema 
} from '../middleware/humanTakeoverValidation';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAnyRole);

// Rutas de control de conversaciones
/**
 * @route POST /api/v1/takeover/:conversationId/start
 * @desc Iniciar toma de control de una conversación
 * @access Private (Any role)
 */
router.post('/:conversationId/start', validateRequest(startTakeoverSchema), HumanTakeoverController.startTakeover);

/**
 * @route POST /api/v1/takeover/:conversationId/message
 * @desc Enviar mensaje como agente humano
 * @access Private (Any role)
 */
router.post('/:conversationId/message', validateRequest(sendMessageSchema), HumanTakeoverController.sendMessage);

/**
 * @route POST /api/v1/takeover/:conversationId/pause
 * @desc Pausar control humano
 * @access Private (Any role)
 */
router.post('/:conversationId/pause', HumanTakeoverController.pauseTakeover);

/**
 * @route POST /api/v1/takeover/:conversationId/resume
 * @desc Reanudar control humano
 * @access Private (Any role)
 */
router.post('/:conversationId/resume', HumanTakeoverController.resumeTakeover);

/**
 * @route POST /api/v1/takeover/:conversationId/end
 * @desc Finalizar control humano
 * @access Private (Any role)
 */
router.post('/:conversationId/end', validateRequest(endTakeoverSchema), HumanTakeoverController.endTakeover);

/**
 * @route POST /api/v1/takeover/:conversationId/transfer
 * @desc Transferir control a otro agente
 * @access Private (Any role)
 */
router.post('/:conversationId/transfer', validateRequest(transferControlSchema), HumanTakeoverController.transferControl);

/**
 * @route GET /api/v1/takeover/:conversationId
 * @desc Obtener sesión activa de una conversación
 * @access Private (Any role)
 */
router.get('/:conversationId', HumanTakeoverController.getSession);

/**
 * @route GET /api/v1/takeover/:conversationId/status
 * @desc Verificar si una conversación está bajo control humano
 * @access Private (Any role)
 */
router.get('/:conversationId/status', HumanTakeoverController.checkHumanControl);

/**
 * @route GET /api/v1/takeover/sessions/my
 * @desc Obtener sesiones activas del agente actual
 * @access Private (Any role)
 */
router.get('/sessions/my', HumanTakeoverController.getMySessions);

/**
 * @route GET /api/v1/takeover/sessions/stats
 * @desc Obtener estadísticas de sesiones
 * @access Private (Any role)
 */
router.get('/sessions/stats', HumanTakeoverController.getSessionStats);

// Rutas administrativas (requieren permisos de manager o admin)
router.use(requireManagerOrAdmin);

/**
 * @route POST /api/v1/takeover/sessions/cleanup
 * @desc Limpiar sesiones inactivas
 * @access Private (Manager/Admin)
 */
router.post('/sessions/cleanup', HumanTakeoverController.cleanupSessions);

export default router;