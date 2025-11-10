import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticateToken, requireAnyRole, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/v1/products/public
 * @desc Obtener productos disponibles (acceso público)
 * @access Public
 */
router.get('/public', ProductController.getPublicProducts);

/**
 * @route GET /api/v1/products/public/:id
 * @desc Obtener producto por ID (acceso público)
 * @access Public
 */
router.get('/public/:id', ProductController.getPublicProduct);

/**
 * @route GET /api/v1/products/public/category/:category
 * @desc Obtener productos por categoría (acceso público)
 * @access Public
 */
router.get('/public/category/:category', ProductController.getPublicProductsByCategory);

/**
 * @route GET /api/v1/products/categories
 * @desc Obtener categorías de productos (acceso público)
 * @access Public
 */
router.get('/categories', ProductController.getProductCategories);

// Aplicar autenticación a todas las rutas siguientes
router.use(authenticateToken);
router.use(requireAnyRole);

// Rutas principales de productos
router.post('/', ProductController.createProduct);
router.get('/', ProductController.getProducts);
router.get('/stats', ProductController.getProductStats);
router.get('/categories', ProductController.getProductCategories);
router.get('/low-stock-alerts', ProductController.getLowStockAlerts);
router.get('/category/:category', ProductController.getProductsByCategory);
router.get('/compatible/:serviceId', ProductController.getCompatibleProducts);
router.get('/:id', ProductController.getProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

// Rutas de gestión de stock
router.put('/:id/stock', ProductController.updateStock);
router.get('/:id/stock/movements', ProductController.getStockMovements);
router.get('/:id/availability', ProductController.checkAvailability);
router.post('/:id/reserve', ProductController.reserveStock);
router.post('/:id/release', ProductController.releaseStock);
router.post('/bulk/stock', ProductController.bulkUpdateStock);

export default router;