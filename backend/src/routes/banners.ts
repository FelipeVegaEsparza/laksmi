import { Router } from 'express';
import { BannerController, upload } from '../controllers/BannerController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/v1/banners
 * @desc Get all banners (public can see active only)
 * @access Public
 */
router.get('/', BannerController.getAll);

/**
 * @route GET /api/v1/banners/:id
 * @desc Get banner by ID
 * @access Public
 */
router.get('/:id', BannerController.getById);

/**
 * @route POST /api/v1/banners
 * @desc Create new banner
 * @access Private (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, BannerController.create);

/**
 * @route PUT /api/v1/banners/:id
 * @desc Update banner
 * @access Private (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, BannerController.update);

/**
 * @route DELETE /api/v1/banners/:id
 * @desc Delete banner
 * @access Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, BannerController.delete);

/**
 * @route POST /api/v1/banners/:id/upload-image
 * @desc Upload banner image
 * @access Private (Admin only)
 */
router.post('/:id/upload-image', authenticateToken, requireAdmin, upload.single('image'), BannerController.uploadImage);

/**
 * @route POST /api/v1/banners/reorder
 * @desc Reorder banners
 * @access Private (Admin only)
 */
router.post('/reorder', authenticateToken, requireAdmin, BannerController.reorder);

export default router;
