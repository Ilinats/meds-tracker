import { PrismaClient } from '../../../../prisma/app/generated/prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: {
      id: string;
    };
}

export const recordMedicineIntake = async (req: AuthRequest, res: Response) => {
    try {
      const { scheduleId } = req.params;
      const { takenAt = new Date() } = req.body;
  
      const schedule = await prisma.medicineSchedule.findUnique({
        where: {
          id: scheduleId,
          userId: req.user!.id
        },
        include: {
          userMedicine: true
        }
      });
  
      if (!schedule) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Schedule not found'
          }
        });
        return;
      }
  
      await prisma.medicineTaken.create({
        data: {
          scheduleId,
          userId: req.user!.id,
          takenAt: new Date(takenAt),
          dosageAmount: schedule.dosageAmount
        }
      });
  
      await prisma.userMedicine.update({
        where: {
          id: schedule.userMedicineId
        },
        data: {
          quantity: {
            decrement: schedule.dosageAmount
          }
        }
      });
  
      res.json({
        success: true,
        message: 'Medicine intake recorded successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Unable to record medicine intake'
        }
      });
    }
  };