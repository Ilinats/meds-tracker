import express from 'express';
import cors from 'cors';
import { AuthModule } from './modules/auth';
import { MedicinesModule } from './modules/medicines';
import { SchedulerModule } from './modules/scheduler';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../src/shared/middleware/auth.middleware';
const prisma = new PrismaClient();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  SchedulerModule.initialize();
}

app.use('/api/auth', AuthModule.routes);
app.use('/api/medicines', MedicinesModule.routes);
app.use('/api/scheduler', SchedulerModule.routes);

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'You have access to this protected route'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
  
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected',
        api: 'running'
      },
      error: message
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;