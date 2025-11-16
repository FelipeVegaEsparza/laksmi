import { Router } from 'express';
import { WhatsAppWebController } from '../controllers/WhatsAppWebController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @route GET /api/v1/whatsapp-web/status
 * @desc Obtener estado de conexión y QR code
 * @access Private
 */
router.get('/status', WhatsAppWebController.getStatus);

/**
 * @route POST /api/v1/whatsapp-web/connect
 * @desc Iniciar conexión de WhatsApp
 * @access Private
 */
router.post('/connect', WhatsAppWebController.connect);

/**
 * @route POST /api/v1/whatsapp-web/disconnect
 * @desc Desconectar WhatsApp
 * @access Private
 */
router.post('/disconnect', WhatsAppWebController.disconnect);

/**
 * @route POST /api/v1/whatsapp-web/send-test
 * @desc Enviar mensaje de prueba
 * @access Private
 */
router.post('/send-test', WhatsAppWebController.sendTestMessage);

export default router;
