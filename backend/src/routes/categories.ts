import express from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/v1/categories/public
 * @desc    Get all active categories (public)
 * @access  Public
 */
router.get('/public', CategoryController.getCategories);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Private
 */
router.get('/', authenticateToken, CategoryController.getCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, CategoryController.getCategoryById);

/**
 * @route   GET /api/v1/categories/:id/usage
 * @desc    Get category usage (count of services/products using it)
 * @access  Private (Admin)
 */
router.get('/:id/usage', authenticateToken, requireAdmin, CategoryController.getCategoryUsage);

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category
 * @access  Private (Admin)
 */
router.post('/', authenticateToken, requireAdmin, CategoryController.createCategory);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (Admin)
 */
router.put('/:id', authenticateToken, requireAdmin, CategoryController.updateCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, CategoryController.deleteCategory);

export default router;
