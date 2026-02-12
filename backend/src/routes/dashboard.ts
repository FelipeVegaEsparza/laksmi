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

// Temporary diagnostic endpoints
router.get('/check-whatsapp-channels', DashboardController.checkWhatsAppChannels);
router.post('/fix-whatsapp-channels', DashboardController.fixWhatsAppChannels);

export default router;
