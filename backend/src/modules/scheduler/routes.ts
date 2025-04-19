import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { getExpiringMedicines, getLowStockMedicines } from './controllers/scheduleController';

const router = Router();
router.use(authMiddleware);

router.get('/expiring', getExpiringMedicines);
router.get('/low-stock', getLowStockMedicines);

export default router;