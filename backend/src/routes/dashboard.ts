import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticateToken, requireAnyRole } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);
router.use(requireAnyRole);

// Dashboard metrics
router.get('/metrics', DashboardController.getMetrics);
router.get('/recent-bookings', DashboardController.getRecentBookings);
router.get('/active-conversations', DashboardController.getActiveConversations);

export default router;
