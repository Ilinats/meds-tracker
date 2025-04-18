// // src/index.ts or server.ts (wherever this lives)
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { PrismaClient } from '../prisma/app/generated/prisma/client';
// import authRoutes from './routes/authRoutes'; 
// import { DailyCheckService } from './services/dailyCheckService';
// import schedule from 'node-schedule';

// import medicineRoutes from './routes/medicineRoutes';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const prisma = new PrismaClient();

// app.use('/api', medicineRoutes);
// app.use('/api/auth', authRoutes);


// app.get('/ping', (req, res) => {
//   res.send('Pong from Meds Tracker API!');
// });

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

// schedule.scheduleJob('0 0 * * *', async () => {
//   await DailyCheckService.checkLowStock();
//   await DailyCheckService.checkExpiringMedicines();
// });

// schedule.scheduleJob('* * * * *', async () => {
//   await DailyCheckService.checkDailySchedule();
// });

import express from 'express';
import cors from 'cors';
import { AuthModule } from './modules/auth';
import { MedicinesModule } from './modules/medicines';
import { SchedulerModule } from './modules/scheduler';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Initialize scheduler
SchedulerModule.initialize();

// Mount routes
app.use('/api/auth', AuthModule.routes);
app.use('/api/medicines', MedicinesModule.routes);
app.use('/api/scheduler', SchedulerModule.routes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});