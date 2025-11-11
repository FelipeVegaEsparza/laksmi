import { Router } from 'express';
import { FeaturedImageController, upload } from '../controllers/FeaturedImageController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/v1/featured-images
 * @desc Get all featured images
 * @access Public
 */
router.get('/', FeaturedImageController.getAll);

/**
 * @route GET /api/v1/featured-images/:slot
 * @desc Get featured image by slot (1 or 2)
 * @access Public
 */
router.get('/:slot', FeaturedImageController.getBySlot);

/**
 * @route PUT /api/v1/featured-images/:slot
 * @desc Update featured image
 * @access Private (Admin only)
 */
router.put('/:slot', authenticateToken, requireAdmin, FeaturedImageController.update);

/**
 * @route POST /api/v1/featured-images/:slot/upload-image
 * @desc Upload featured image
 * @access Private (Admin only)
 */
router.post('/:slot/upload-image', authenticateToken, requireAdmin, upload.single('image'), FeaturedImageController.uploadImage);

export default router;
