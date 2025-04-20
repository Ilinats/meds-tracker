import { PrismaClient } from '../../prisma/app/generated/prisma/client';
import dotenv from 'dotenv';

process.env.NODE_ENV = 'test';
dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

export default async function globalSetup() {
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must be run against a test database!');
  }

  await prisma.$transaction([
    prisma.medicineTaken.deleteMany(),
    prisma.medicineSchedule.deleteMany(),
    prisma.userMedicine.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.$disconnect();
}