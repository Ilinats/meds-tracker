import { PrismaClient, MedicineUnit } from '../../prisma/app/generated/prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const userId = "f6960d1a-db9a-46c5-b76d-147fd7743e76";

interface AuthRequest extends Request {
    user?: {
      id: string;
    };
}

export const getExpiringMedicines = async (req: AuthRequest, res: Response) => {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
      const medicines = await prisma.userMedicine.findMany({
        where: {
        //   userId: req.user!.id,
          userId: userId,
          expiryDate: {
            lte: sevenDaysFromNow,
            gte: new Date()
          }
        },
        include: {
          schedules: true,
          presetMedicine: true
        },
        orderBy: {
          expiryDate: 'asc'
        }
      });
  
      res.json({
        success: true,
        data: medicines
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Unable to fetch expiring medicines'
        }
      });
    }
};

export const getLowStockMedicines = async (req: AuthRequest, res: Response) => {
    try {
      const medicines = await prisma.userMedicine.findMany({
        where: {
        //   userId: req.user!.id,
          userId: userId,
          quantity: {
            lte: 5
          }
        },
        include: {
          schedules: true,
          presetMedicine: true
        },
        orderBy: {
          quantity: 'asc'
        }
      });
  
      res.json({
        success: true,
        data: medicines
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Unable to fetch low stock medicines'
        }
      });
    }
};
  
