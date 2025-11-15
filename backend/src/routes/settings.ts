import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authenticateToken, requireAnyRole } from '../middleware/auth';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);
router.use(requireAnyRole);

/**
 * @route GET /api/v1/settings/twilio
 * @desc Obtener configuración de Twilio
 * @access Private (Any role)
 */
router.get('/twilio', SettingsController.getTwilioConfig);

/**
 * @route PUT /api/v1/settings/twilio
 * @desc Actualizar configuración de Twilio
 * @access Private (Any role)
 */
router.put('/twilio', SettingsController.updateTwilioConfig);

/**
 * @route GET /api/v1/settings/twilio/test-connection
 * @desc Probar conexión de Twilio
 * @access Private (Any role)
 */
router.get('/twilio/test-connection', SettingsController.testTwilioConnection);

/**
 * @route POST /api/v1/settings/twilio/test
 * @desc Enviar mensaje de prueba
 * @access Private (Any role)
 */
router.post('/twilio/test', SettingsController.testTwilioMessage);

/**
 * @route GET /api/v1/settings/whatsapp-templates
 * @desc Obtener plantillas de WhatsApp
 * @access Private (Any role)
 */
router.get('/whatsapp-templates', SettingsController.getWhatsAppTemplates);

export default router;
