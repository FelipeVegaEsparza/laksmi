import { Router } from 'express';
import { LoyaltyController } from '../controllers/LoyaltyController';
import { authenticateToken, requireAnyRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);
router.use(requireAnyRole);

// Esquemas de validación
const awardPointsSchema = Joi.object({
  points: Joi.number().min(1).max(10000).required(),
  reason: Joi.string().min(3).max(200).required(),
  referenceId: Joi.string().optional(),
  referenceType: Joi.string().valid('booking', 'purchase', 'manual', 'bonus').optional()
});

const redeemPointsSchema = Joi.object({
  points: Joi.number().min(1).max(10000).required(),
  reason: Joi.string().min(3).max(200).required(),
  referenceId: Joi.string().optional(),
  referenceType: Joi.string().valid('booking', 'purchase', 'manual').optional()
});

const calculatePointsSchema = Joi.object({
  amount: Joi.number().min(0).required()
});

/**
 * @route GET /api/v1/loyalty/tiers
 * @desc Obtener niveles de lealtad disponibles
 * @access Private (Any role)
 */
router.get('/tiers', LoyaltyController.getLoyaltyTiers);

/**
 * @route GET /api/v1/loyalty/points/:points/value
 * @desc Obtener valor monetario de puntos
 * @access Private (Any role)
 */
router.get('/points/:points/value', LoyaltyController.getPointsValue);

/**
 * @route POST /api/v1/loyalty/calculate-points
 * @desc Calcular puntos por monto de compra
 * @access Private (Any role)
 */
router.post('/calculate-points', validateRequest(calculatePointsSchema), LoyaltyController.calculatePointsForPurchase);

/**
 * @route GET /api/v1/loyalty/client/:clientId/stats
 * @desc Obtener estadísticas de lealtad del cliente
 * @access Private (Any role)
 */
router.get('/client/:clientId/stats', LoyaltyController.getClientLoyaltyStats);

/**
 * @route GET /api/v1/loyalty/client/:clientId/tier
 * @desc Obtener nivel actual del cliente
 * @access Private (Any role)
 */
router.get('/client/:clientId/tier', LoyaltyController.getClientTier);

/**
 * @route POST /api/v1/loyalty/client/:clientId/award
 * @desc Otorgar puntos a un cliente
 * @access Private (Any role)
 */
router.post('/client/:clientId/award', validateRequest(awardPointsSchema), LoyaltyController.awardPoints);

/**
 * @route POST /api/v1/loyalty/client/:clientId/redeem
 * @desc Canjear puntos de un cliente
 * @access Private (Any role)
 */
router.post('/client/:clientId/redeem', validateRequest(redeemPointsSchema), LoyaltyController.redeemPoints);

/**
 * @route POST /api/v1/loyalty/client/:clientId/welcome-bonus
 * @desc Otorgar bono de bienvenida
 * @access Private (Any role)
 */
router.post('/client/:clientId/welcome-bonus', LoyaltyController.awardWelcomeBonus);

/**
 * @route POST /api/v1/loyalty/client/:clientId/birthday-bonus
 * @desc Otorgar bono de cumpleaños
 * @access Private (Any role)
 */
router.post('/client/:clientId/birthday-bonus', LoyaltyController.awardBirthdayBonus);

export default router;