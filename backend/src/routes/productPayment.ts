import { Router } from 'express';
import { ProductPaymentController } from '../controllers/ProductPaymentController';

const router = Router();

/**
 * POST /api/v1/products/:id/request-payment
 * Solicitar pago de producto - Envía email con link de pago
 * Body: { name, phone, address, quantity }
 */
router.post('/:id/request-payment', ProductPaymentController.requestPayment);

export default router;
