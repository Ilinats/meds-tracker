// src/tests/setup.ts
import { PrismaClient } from '../../prisma/app/generated/prisma/client';
import dotenv from 'dotenv';

// Load test environment variables
process.env.NODE_ENV = 'test';
dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

// Global setup
export default async function globalSetup() {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must be run against a test database!');
  }

  // Clean up database
  await prisma.$transaction([
    prisma.medicineTaken.deleteMany(),
    prisma.medicineSchedule.deleteMany(),
    prisma.userMedicine.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.$disconnect();
}