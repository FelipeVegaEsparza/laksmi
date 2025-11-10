import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { authenticateToken, requireAnyRole, requireManagerOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { processMessageSchema, analyzeMessageSchema, trainNLUSchema } from '../middleware/aiValidation';

const router = Router();

// Rutas públicas para procesamiento de mensajes
/**
 * @route POST /api/v1/ai/message
 * @desc Procesar mensaje de chat (web)
 * @access Public
 */
router.post('/message', validateRequest(processMessageSchema), AIController.processMessage);

/**
 * @route POST /api/v1/ai/webhook/twilio
 * @desc Webhook para mensajes de Twilio WhatsApp
 * @access Public (Twilio)
 */
router.post('/webhook/twilio', AIController.twilioWebhook);

/**
 * @route POST /api/v1/ai/analyze
 * @desc Analizar mensaje con NLU (para testing)
 * @access Public
 */
router.post('/analyze', validateRequest(analyzeMessageSchema), AIController.analyzeMessage);

// Aplicar autenticación a todas las rutas siguientes
router.use(authenticateToken);
router.use(requireAnyRole);

// Rutas de gestión de conversaciones (requieren autenticación)
/**
 * @route GET /api/v1/ai/conversations
 * @desc Obtener conversaciones con filtros
 * @access Private (Any role)
 */
router.get('/conversations', AIController.getConversations);

/**
 * @route GET /api/v1/ai/conversations/:id
 * @desc Obtener conversación específica con mensajes
 * @access Private (Any role)
 */
router.get('/conversations/:id', AIController.getConversation);

/**
 * @route POST /api/v1/ai/conversations/:id/escalate
 * @desc Escalar conversación a agente humano
 * @access Private (Any role)
 */
router.post('/conversations/:id/escalate', AIController.escalateConversation);

/**
 * @route POST /api/v1/ai/conversations/:id/close
 * @desc Cerrar conversación
 * @access Private (Any role)
 */
router.post('/conversations/:id/close', AIController.closeConversation);

// Rutas de gestión de contexto
/**
 * @route GET /api/v1/ai/context/:conversationId
 * @desc Obtener contexto de conversación
 * @access Private (Any role)
 */
router.get('/context/:conversationId', AIController.getContext);

/**
 * @route PUT /api/v1/ai/context/:conversationId
 * @desc Actualizar contexto de conversación
 * @access Private (Any role)
 */
router.put('/context/:conversationId', AIController.updateContext);

/**
 * @route DELETE /api/v1/ai/context/:conversationId
 * @desc Limpiar contexto de conversación
 * @access Private (Any role)
 */
router.delete('/context/:conversationId', AIController.clearContext);

// Rutas de estadísticas y análisis
/**
 * @route GET /api/v1/ai/stats
 * @desc Obtener estadísticas del sistema de IA
 * @access Private (Any role)
 */
router.get('/stats', AIController.getAIStats);

// Rutas administrativas (requieren permisos de manager o admin)
router.use(requireManagerOrAdmin);

/**
 * @route GET /api/v1/ai/config
 * @desc Obtener configuración del sistema de IA
 * @access Private (Manager/Admin)
 */
router.get('/config', AIController.getConfig);

/**
 * @route PUT /api/v1/ai/config
 * @desc Actualizar configuración del sistema de IA
 * @access Private (Manager/Admin)
 */
router.put('/config', AIController.updateConfig);

/**
 * @route POST /api/v1/ai/train
 * @desc Entrenar NLU con nuevos ejemplos
 * @access Private (Manager/Admin)
 */
router.post('/train', validateRequest(trainNLUSchema), AIController.trainNLU);

/**
 * @route POST /api/v1/ai/cleanup
 * @desc Limpiar conversaciones inactivas
 * @access Private (Manager/Admin)
 */
router.post('/cleanup', AIController.cleanupInactiveConversations);

export default router;