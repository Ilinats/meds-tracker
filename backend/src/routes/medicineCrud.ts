import { PrismaClient, MedicineUnit, Prisma } from '../../prisma/app/generated/prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const userId = "f6960d1a-db9a-46c5-b76d-147fd7743e76";

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
        userId: userId,
        presetMedicineId,
        ...(schedules && {
          schedules: {
            create: schedules.map((schedule: any) => ({
            //   userId: req.user!.id,
              userId: userId,
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
        //   userId: req.user!.id
          userId: userId
        }
      });
  
      await prisma.userMedicine.delete({
        where: {
          id,
        //   userId: req.user!.id
          userId: userId
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

export const getAllPresetMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    
    const where = {
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { category: { contains: String(search), mode: 'insensitive' } }
        ]
      }),
      ...(category && { category: String(category) })
    };

    const medicines = await prisma.presetMedicine.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: {
        name: 'asc'
      }
    });

    const total = await prisma.presetMedicine.count({});

    res.json({
      success: true,
      data: {
        medicines,
        pagination: {
          total,
          pages: Math.ceil(total / Number(limit)),
          currentPage: Number(page)
        }
      }
    });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Unable to fetch preset medicines'
        }
      });
    }
};

export const getUserMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category } = req.query;

    const medicines = await prisma.userMedicine.findMany({
      where: {
        userId: userId,
        ...(search && {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { category: { contains: String(search), mode: 'insensitive' } }
          ]
        }),
        ...(category && { category: String(category) })
      },
      include: {
        schedules: true,
        presetMedicine: false
      },
      orderBy: {
        createdAt: 'desc'
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
        message: 'Unable to fetch user medicines'
      }
    });
  }
};

export const updateUserMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      quantity,
      startDate,
      endDate,
      dosagePerDay,
      schedules,
      ...updateData
    } = req.body;

    const medicine = await prisma.userMedicine.update({
      where: {
        id,
        // userId: req.user!.id
        userId: userId
      },
      data: {
        ...updateData,
        quantity,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        dosagePerDay,
        ...(schedules && {
          schedules: {
            deleteMany: {},
            create: schedules.map((schedule: any) => ({
              // userId: req.user!.id,
              userId: userId,
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

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Unable to update medicine'
      }
    });
  }
};

