import { Router } from 'express';
import LegalPageController from '../controllers/LegalPageController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rutas públicas (para frontend)
router.get('/public/:type', LegalPageController.getByType);

// Rutas protegidas (para dashboard)
router.get('/', authenticateToken, LegalPageController.getAll);
router.put('/:type', authenticateToken, LegalPageController.update);

export default router;
