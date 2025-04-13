import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '../prisma/app/generated/prisma/client';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

app.get('/ping', (req, res) => {
  res.send('Pong from Meds Tracker API!');
});

// app.get('/medicines', async (req, res) => {
//   const medicines = await prisma.medicine.findMany();  
//   res.json(medicines);
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
