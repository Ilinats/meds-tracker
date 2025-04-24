import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { encryptSensitiveData, decryptSensitiveData } from '../../shared/middleware/encryption.middleware';
import {
  addToCollection,
  removeFromCollection,
  getAllPresetMedicines,
  getUserMedicines,
  updateUserMedicine,
  // createMedicine,
  // getMedicines,
  // updateMedicine,
  // deleteMedicine
} from './controllers/medicineController';
import { recordMedicineIntake } from './controllers/medicineIntakeController';

const router = Router();
router.use(authMiddleware);
router.use(encryptSensitiveData);
router.use(decryptSensitiveData);

router.post('/collection', addToCollection);
router.delete('/collection/:id', removeFromCollection);
router.get('/preset', getAllPresetMedicines);
router.get('/collection', getUserMedicines);
router.put('/collection/:id', updateUserMedicine);
router.post('/intake/:scheduleId', recordMedicineIntake);
// router.post('/', createMedicine);
// router.get('/', getMedicines);
// router.put('/:id', updateMedicine);
// router.delete('/:id', deleteMedicine);

export default router;