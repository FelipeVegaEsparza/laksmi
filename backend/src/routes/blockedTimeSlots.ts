import { Router } from 'express';
import { BlockedTimeSlotController } from '../controllers/BlockedTimeSlotController';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireManagerOrAdmin);

router.post('/', BlockedTimeSlotController.create);
router.get('/', BlockedTimeSlotController.getAll);
router.get('/range', BlockedTimeSlotController.getByDateRange);
router.delete('/:id', BlockedTimeSlotController.delete);

export default router;
