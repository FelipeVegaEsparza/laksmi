import { Router } from 'express';
import { BlockedTimeSlotController } from '../controllers/BlockedTimeSlotController';
import { authenticateToken, requireAnyRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireAnyRole);

router.post('/', BlockedTimeSlotController.create);
router.get('/', BlockedTimeSlotController.getAll);
router.get('/range', BlockedTimeSlotController.getByDateRange);
router.delete('/:id', BlockedTimeSlotController.delete);

export default router;
