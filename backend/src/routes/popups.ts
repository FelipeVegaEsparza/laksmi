import { Router } from 'express';
import PopupController, { upload } from '../controllers/PopupController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/v1/popups/active
 * @desc Obtener popups activos (público)
 * @access Public
 */
router.get('/active', PopupController.getActive);

/**
 * @route GET /api/v1/popups
 * @desc Obtener todos los popups
 * @access Private (Admin only)
 */
router.get('/', authenticateToken, requireAdmin, PopupController.getAll);

/**
 * @route GET /api/v1/popups/:id
 * @desc Obtener un popup por ID
 * @access Private (Admin only)
 */
router.get('/:id', authenticateToken, requireAdmin, PopupController.getById);

/**
 * @route POST /api/v1/popups
 * @desc Crear un nuevo popup
 * @access Private (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, PopupController.create);

/**
 * @route PUT /api/v1/popups/:id
 * @desc Actualizar un popup
 * @access Private (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, PopupController.update);

/**
 * @route DELETE /api/v1/popups/:id
 * @desc Eliminar un popup
 * @access Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, PopupController.delete);

/**
 * @route POST /api/v1/popups/upload
 * @desc Subir imagen de popup
 * @access Private (Admin only)
 */
router.post('/upload', authenticateToken, requireAdmin, upload.single('image'), PopupController.uploadImage);

export default router;
