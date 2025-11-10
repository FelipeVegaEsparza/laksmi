import { Router } from 'express';
import { ConversationController } from '../controllers/ConversationController';
import { authenticateToken, requireAnyRole } from '../middleware/auth';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAnyRole);

/**
 * @route GET /api/v1/conversations
 * @desc Obtener conversaciones con filtros y paginación
 * @access Private (Any role)
 */
router.get('/', ConversationController.getConversations);

/**
 * @route GET /api/v1/conversations/active
 * @desc Obtener conversaciones activas en tiempo real
 * @access Private (Any role)
 */
router.get('/active', ConversationController.getActiveConversations);

/**
 * @route GET /api/v1/conversations/metrics
 * @desc Obtener métricas del monitor de conversaciones
 * @access Private (Any role)
 */
router.get('/metrics', ConversationController.getConversationMetrics);

/**
 * @route GET /api/v1/conversations/analytics/channels
 * @desc Obtener análisis de rendimiento por canal
 * @access Private (Any role)
 */
router.get('/analytics/channels', ConversationController.getChannelAnalytics);

/**
 * @route GET /api/v1/conversations/analytics/response-time
 * @desc Obtener estadísticas de tiempo de respuesta
 * @access Private (Any role)
 */
router.get('/analytics/response-time', ConversationController.getResponseTimeStats);

/**
 * @route GET /api/v1/conversations/export
 * @desc Exportar conversaciones a CSV
 * @access Private (Manager/Admin)
 */
router.get('/export', ConversationController.exportConversations);

/**
 * @route GET /api/v1/conversations/:id
 * @desc Obtener conversación específica con mensajes
 * @access Private (Any role)
 */
router.get('/:id', ConversationController.getConversation);

/**
 * @route GET /api/v1/conversations/:id/messages
 * @desc Obtener mensajes de una conversación
 * @access Private (Any role)
 */
router.get('/:id/messages', ConversationController.getConversationMessages);

/**
 * @route POST /api/v1/conversations/:id/close
 * @desc Cerrar conversación
 * @access Private (Any role)
 */
router.post('/:id/close', ConversationController.closeConversation);

/**
 * @route POST /api/v1/conversations/:id/reopen
 * @desc Reabrir conversación
 * @access Private (Any role)
 */
router.post('/:id/reopen', ConversationController.reopenConversation);

export default router;