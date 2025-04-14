// src/routes/medicineRoutes.ts
import express from 'express';
// import { authMiddleware } from '../middleware/auth';
import {
  addToCollection,
  removeFromCollection,
  getAllPresetMedicines,
  getUserMedicines,
  updateUserMedicine
} from './medicineCrud';

import {
    getExpiringMedicines,
    getLowStockMedicines
} from './medicineChecks'

const router = express.Router();

// router.use(authMiddleware);

router.post('/collection', addToCollection);
router.delete('/collection/:id', removeFromCollection);
router.get('/presets', getAllPresetMedicines);
router.get('/collection', getUserMedicines);
router.put('/collection/:id', updateUserMedicine);
router.get('/expiring', getExpiringMedicines);
router.get('/low-stock', getLowStockMedicines);

export default router;