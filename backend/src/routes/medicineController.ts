import { PrismaClient, MedicineUnit } from '../../prisma/app/generated/prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const addToCollection = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      category,
      unit,
      quantity,
      expiryDate,
      startDate,
      endDate,
      dosagePerDay,
      prescription,
      presetMedicineId, 
      schedules 
    } = req.body;

    const userMedicine = await prisma.userMedicine.create({
      data: {
        name,
        category,
        unit: unit as MedicineUnit,
        quantity,
        expiryDate: new Date(expiryDate),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        dosagePerDay,
        prescription,
        isPreset: !!presetMedicineId,
        // userId: req.user!.id,
        userId: "f6960d1a-db9a-46c5-b76d-147fd7743e76",
        presetMedicineId,
        ...(schedules && {
          schedules: {
            create: schedules.map((schedule: any) => ({
            //   userId: req.user!.id,
              userId: "f6960d1a-db9a-46c5-b76d-147fd7743e76",
              timesOfDay: schedule.timesOfDay,
              repeatDays: schedule.repeatDays,
              dosageAmount: schedule.dosageAmount
            }))
          }
        })
      },
      include: {
        schedules: true,
        presetMedicine: true
      }
    });

    res.status(201).json({
      success: true,
      data: userMedicine
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Unable to add medicine to collection'
      }
    });
  }
};

export const removeFromCollection = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
  
      await prisma.medicineSchedule.deleteMany({
        where: {
          userMedicineId: id,
          userId: req.user!.id
        }
      });
  
      await prisma.userMedicine.delete({
        where: {
          id,
          userId: req.user!.id
        }
      });
  
    res.json({
        success: true,
        message: 'Medicine removed from collection'
    });
    } catch (error) {
        res.status(400).json({
        success: false,
        error: {
            message: 'Unable to remove medicine from collection'
        }
        });
    }
};
  
