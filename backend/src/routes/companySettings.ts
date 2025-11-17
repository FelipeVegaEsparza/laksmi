import { Router } from 'express';
import { CompanySettingsController, upload } from '../controllers/CompanySettingsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/v1/company-settings
 * @desc Obtener configuración de la empresa (público)
 * @access Public
 */
router.get('/', CompanySettingsController.getSettings);

/**
 * @route PUT /api/v1/company-settings
 * @desc Actualizar configuración de la empresa
 * @access Private (Admin only)
 */
router.put('/', authenticateToken, requireAdmin, CompanySettingsController.updateSettings);

/**
 * @route POST /api/v1/company-settings/logo
 * @desc Subir logo de la empresa
 * @access Private (Admin only)
 */
router.post('/logo', authenticateToken, requireAdmin, upload.single('logo'), CompanySettingsController.uploadLogo);

/**
 * @route DELETE /api/v1/company-settings/logo
 * @desc Eliminar logo de la empresa
 * @access Private (Admin only)
 */
router.delete('/logo', authenticateToken, requireAdmin, CompanySettingsController.deleteLogo);

/**
 * @route POST /api/v1/company-settings/init-business-hours
 * @desc Inicializar horarios por defecto del local
 * @access Private (Admin only)
 */
router.post('/init-business-hours', authenticateToken, requireAdmin, CompanySettingsController.initBusinessHours);

export default router;
