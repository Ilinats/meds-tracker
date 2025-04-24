import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../../utils/encryption';
import { AuthRequest } from '../types/express.types';

const prisma = new PrismaClient();

// Fields that should be encrypted
const SENSITIVE_FIELDS = [
  'name',
  'category',
  'prescription',
  'dosagePerDay',
  'quantity',
  'timesOfDay',
  'repeatDays',
  'dosageAmount'
];

export const encryptSensitiveData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user?.encryptionKey) {
      return next();
    }

    // Encrypt sensitive fields in request body
    if (req.body) {
      const encryptedData: any = {};

      Object.entries(req.body).forEach(([key, value]) => {
        if (SENSITIVE_FIELDS.includes(key)) {
          encryptedData[key] = EncryptionService.encrypt(
            value,
            user.encryptionKey
          );
        }
      });

      // Replace original values with encrypted ones
      Object.assign(req.body, encryptedData);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const decryptSensitiveData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user?.encryptionKey) {
      return next();
    }

    // Decrypt sensitive fields in response
    if (res.locals.data) {
      const decryptedData: any = {};

      Object.entries(res.locals.data).forEach(([key, value]) => {
        if (SENSITIVE_FIELDS.includes(key) && typeof value === 'string') {
          try {
            decryptedData[key] = EncryptionService.decrypt(
              value,
              user.encryptionKey
            );
          } catch (error) {
            console.error(`Failed to decrypt ${key}:`, error);
            decryptedData[key] = value; // Keep original if decryption fails
          }
        }
      });

      // Replace encrypted values with decrypted ones
      Object.assign(res.locals.data, decryptedData);
    }

    next();
  } catch (error) {
    next(error);
  }
}; 