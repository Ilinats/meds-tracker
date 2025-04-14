// src/routes/medicineRoutes.ts
import express from 'express';
// import { authMiddleware } from '../middleware/auth';
import {
  addToCollection,
} from './medicineController';

const router = express.Router();

// router.use(authMiddleware);

router.post('/collection', addToCollection);

export default router;