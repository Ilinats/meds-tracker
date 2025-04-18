import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import {
  addToCollection,
  removeFromCollection,
  getAllPresetMedicines,
  getUserMedicines,
  updateUserMedicine
} from './controllers/medicineController';
import { recordMedicineIntake } from './controllers/medicineIntakeController';

const router = Router();
router.use(authMiddleware);

router.post('/collection', addToCollection);
router.delete('/collection/:id', removeFromCollection);
router.get('/presets', getAllPresetMedicines);
router.get('/collection', getUserMedicines);
router.put('/collection/:id', updateUserMedicine);
router.post('/intake/:scheduleId', recordMedicineIntake);

export default router;