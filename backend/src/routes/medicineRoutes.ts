// src/routes/medicineRoutes.ts
import express from 'express';
// import { authMiddleware } from '../middleware/auth';
import { Request, Response } from 'express';
import { PrismaClient } from '../../prisma/app/generated/prisma/client';
import {
  addToCollection,
  removeFromCollection,
  getAllPresetMedicines,
  getUserMedicines,
  updateUserMedicine,
} from './medicineCrud';

import {
    getExpiringMedicines,
    getLowStockMedicines
} from './medicineChecks'

import { searchMedicines } from './searchController';

const router = express.Router();

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// router.use(authMiddleware);

router.post('/collection', addToCollection);
router.delete('/collection/:id', removeFromCollection);
router.get('/presets', getAllPresetMedicines);
router.get('/collection', getUserMedicines);
router.put('/collection/:id', updateUserMedicine);
router.get('/expiring', getExpiringMedicines);
router.get('/low-stock', getLowStockMedicines);
router.get('/search', searchMedicines);

export default router;