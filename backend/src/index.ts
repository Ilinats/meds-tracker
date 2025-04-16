// src/index.ts or server.ts (wherever this lives)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '../prisma/app/generated/prisma/client';
import authRoutes from './routes/authRoutes'; // 👈 import it at the top

import medicineRoutes from './routes/medicineRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

app.use('/api', medicineRoutes);
app.use('/api/auth', authRoutes); // 👈 this line mounts the auth endpoints


app.get('/ping', (req, res) => {
  res.send('Pong from Meds Tracker API!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
