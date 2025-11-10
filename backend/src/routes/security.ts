import { Router } from 'express';
import { SecurityController } from '../controllers/SecurityController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// All security routes require authentication
router.use(authenticateToken);

// Block IP schema
const blockIPSchema = Joi.object({
  ip: Joi.string().ip().required(),
  reason: Joi.string().max(500).optional()
});

/**
 * @route GET /api/v1/security/stats
 * @desc Get security statistics and metrics
 * @access Private (Admin only)
 */
router.get('/stats', requireAdmin, SecurityController.getSecurityStats);

/**
 * @route GET /api/v1/security/events/recent
 * @desc Get recent security events for monitoring
 * @access Private (Admin only)
 */
router.get('/events/recent', requireAdmin, SecurityController.getRecentSecurityEvents);

/**
 * @route GET /api/v1/security/events/ip/:ip
 * @desc Get security events for a specific IP address
 * @access Private (Admin only)
 */
router.get('/events/ip/:ip', requireAdmin, SecurityController.getSecurityEventsForIP);

/**
 * @route GET /api/v1/security/ip/:ip/status
 * @desc Check if an IP address is blocked
 * @access Private (Admin only)
 */
router.get('/ip/:ip/status', requireAdmin, SecurityController.checkIPStatus);

/**
 * @route POST /api/v1/security/ip/block
 * @desc Manually block an IP address
 * @access Private (Admin only)
 */
router.post('/ip/block', requireAdmin, validateRequest(blockIPSchema), SecurityController.blockIP);

/**
 * @route POST /api/v1/security/cleanup
 * @desc Cleanup old security events
 * @access Private (Admin only)
 */
router.post('/cleanup', requireAdmin, SecurityController.cleanupSecurityEvents);

export default router;