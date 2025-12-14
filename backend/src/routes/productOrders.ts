import { Router } from 'express';
import { ProductOrderController } from '../controllers/ProductOrderController';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación de manager o admin
router.use(authenticateToken);
router.use(requireManagerOrAdmin);

// GET /api/v1/product-orders - Obtener todas las órdenes
router.get('/', ProductOrderController.getOrders);

// GET /api/v1/product-orders/stats - Obtener estadísticas
router.get('/stats', ProductOrderController.getStats);

// GET /api/v1/product-orders/:id - Obtener una orden por ID
router.get('/:id', ProductOrderController.getOrderById);

// PATCH /api/v1/product-orders/:id/payment-status - Actualizar estado de pago
router.patch('/:id/payment-status', ProductOrderController.updatePaymentStatus);

// DELETE /api/v1/product-orders/:id - Eliminar una orden
router.delete('/:id', ProductOrderController.deleteOrder);

export default router;
