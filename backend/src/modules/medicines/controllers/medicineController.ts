import { PrismaClient, MedicineUnit, Prisma } from '../../../../prisma/app/generated/prisma/client';
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

    const userId = req.user?.id; 

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'User not authenticated' } });
      return;
    }

    if (!name || !category || !unit || quantity === undefined || !expiryDate) {
        res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' }
      });
      return;
    }

    try {
      const userMedicine = await prisma.userMedicine.create({
        data: {
          name,
          category,
          unit: unit as MedicineUnit,
          quantity: Number(quantity),
          expiryDate: new Date(expiryDate),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          dosagePerDay: dosagePerDay ? Number(dosagePerDay) : null,
          prescription: prescription || null,
          isPreset: Boolean(presetMedicineId),
          userId,
          presetMedicineId,
          ...(schedules && {
            schedules: {
              create: schedules.map((schedule: any) => ({
                userId,
                timesOfDay: Array.isArray(schedule.timesOfDay) ? schedule.timesOfDay : [],
                repeatDays: Array.isArray(schedule.repeatDays) ? schedule.repeatDays : [],
                dosageAmount: Number(schedule.dosageAmount) || 1
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
      return;
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(400).json({
        success: false,
        error: { message: 'Invalid data format' }
      });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: { message: 'Unable to add medicine to collection' }
    });
    return;
  }
};

export const removeFromCollection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'User not authenticated' } });
      return;
    }

    const medicine = await prisma.userMedicine.findFirst({
      where: { id, userId }
    });

    if (!medicine) {
      res.status(404).json({
        success: false,
        error: { message: 'Medicine not found' }
      });
      return;
    }

    await prisma.$transaction([
      prisma.medicineSchedule.deleteMany({
        where: { userMedicineId: id, userId }
      }),
      prisma.userMedicine.delete({
        where: { id, userId }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Medicine removed from collection'
    });
    return;
  } catch (error) {
      res.status(400).json({
      success: false,
      error: { message: 'Unable to remove medicine from collection' }
    });
    return;
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
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'User not authenticated' } });
      return;
    }

    const { search, category } = req.query;

    const where: Prisma.UserMedicineWhereInput = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { category: { contains: String(search), mode: 'insensitive' } }
        ]
      }),
      ...(category && { category: String(category) })
    };

    const medicines = await prisma.userMedicine.findMany({
      where,
      include: {
        schedules: true,
        presetMedicine: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: medicines
    });
    return;
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Unable to fetch user medicines' }
    });
    return;
  }
};

export const updateUserMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      unit,
      quantity,
      startDate,
      endDate,
      dosagePerDay,
      schedules,
      ...updateData
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'User not authenticated' } });
      return;
    }

    const existingMedicine = await prisma.userMedicine.findFirst({
      where: { id, userId }
    });

    if (!existingMedicine) {
        res.status(404).json({
        success: false,
        error: { message: 'Medicine not found' }
      });
      return;
    }

    const medicine = await prisma.userMedicine.update({
      where: {
        id,
        userId
      },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(unit && { unit: unit as MedicineUnit }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(dosagePerDay !== undefined && { dosagePerDay: Number(dosagePerDay) }),
        ...updateData,
        ...(schedules && {
          schedules: {
            deleteMany: {},
            create: schedules.map((schedule: any) => ({
              userId,
              timesOfDay: Array.isArray(schedule.timesOfDay) ? schedule.timesOfDay : [],
              repeatDays: Array.isArray(schedule.repeatDays) ? schedule.repeatDays : [],
              dosageAmount: Number(schedule.dosageAmount) || 1
            }))
          }
        })
      },
      include: {
        schedules: true,
        presetMedicine: true
      }
    });

    res.status(200).json({
      success: true,
      data: medicine
    });
    return;
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { message: 'Unable to update medicine' }
    });
    return;
  }
};
