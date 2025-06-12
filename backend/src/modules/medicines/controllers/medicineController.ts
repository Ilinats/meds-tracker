//import { PrismaClient ,MedicineUnit, Prisma } from '../../../../prisma/app/generated/prisma/client';
import { PrismaClient, MedicineUnit, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { AuthRequest } from '../../../shared/types/express.types';
import { EncryptionService } from '../../../utils/encryption';

const prisma = new PrismaClient();

export const addToCollection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

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

    const parsedQuantity = Number(quantity);
    const quantityToSave = !isNaN(parsedQuantity) ? parsedQuantity : 20;

    const medicine = await prisma.userMedicine.create({
      data: {
        name,
        category,
        unit: unit as MedicineUnit,
        quantity: quantityToSave,
        expiryDate: new Date(expiryDate),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        dosagePerDay: dosagePerDay ? Number(dosagePerDay) : null,
        prescription,
        isPreset: Boolean(presetMedicineId),
        user: {
          connect: {
            id: userId
          }
        },
        ...(presetMedicineId && {
          presetMedicine: {
            connect: {
              id: presetMedicineId
            }
          }
        }),
        ...(schedules && {
          schedules: {
            create: schedules.map((schedule: any) => ({
              timesOfDay: Array.isArray(schedule.timesOfDay) ? schedule.timesOfDay : [],
              repeatDays: Array.isArray(schedule.repeatDays) ? schedule.repeatDays : [],
              dosageAmount: Number(schedule.dosageAmount) || 1,
              user: {
                connect: {
                  id: userId
                }
              }
            }))
          }
        })
      },
      include: {
        schedules: true,
        presetMedicine: true
      }
    });

    res.locals.data = medicine;
    res.status(201).json(medicine);
  } catch (error) {
    console.error('Error adding medicine to collection:', error);
    res.status(500).json({ error: 'Failed to add medicine to collection' });
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

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.encryptionKey) {
      res.status(500).json({ success: false, error: { message: 'User encryption key not found' } });
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

    const decryptedMedicines = medicines.map(medicine => {
      const decryptedMedicine = { ...medicine, presetMedicine: medicine.presetMedicine };

      if (medicine.name) {
        try {
          decryptedMedicine.name = EncryptionService.decrypt(medicine.name, user.encryptionKey);
        } catch (error) {
          console.error('Failed to decrypt name:', error);
        }
      }

      if (medicine.category) {
        try {
          decryptedMedicine.category = EncryptionService.decrypt(medicine.category, user.encryptionKey);
        } catch (error) {
          console.error('Failed to decrypt category:', error);
        }
      }

      if (medicine.prescription) {
        try {
          decryptedMedicine.prescription = EncryptionService.decrypt(medicine.prescription, user.encryptionKey);
        } catch (error) {
          console.error('Failed to decrypt prescription:', error);
        }
      }

      if (medicine.dosagePerDay !== null && medicine.dosagePerDay !== undefined) {
        try {
          const decryptedDosage = EncryptionService.decrypt(medicine.dosagePerDay.toString(), user.encryptionKey);
          decryptedMedicine.dosagePerDay = parseFloat(decryptedDosage);
        } catch (error) {
          console.error('Failed to decrypt dosagePerDay:', error);
        }
      }

      if (medicine.schedules) {
        decryptedMedicine.schedules = medicine.schedules.map(schedule => {
          const decryptedSchedule = { ...schedule };

          if (schedule.timesOfDay) {
            try {
              decryptedSchedule.timesOfDay = schedule.timesOfDay.map(time =>
                EncryptionService.decrypt(time, user.encryptionKey)
              );
            } catch (error) {
              console.error('Failed to decrypt timesOfDay:', error);
            }
          }

          if (schedule.repeatDays) {
            try {
              decryptedSchedule.repeatDays = schedule.repeatDays.map(day =>
                EncryptionService.decrypt(day, user.encryptionKey)
              );
            } catch (error) {
              console.error('Failed to decrypt repeatDays:', error);
            }
          }

          if (schedule.dosageAmount !== null && schedule.dosageAmount !== undefined) {
            try {
              const decryptedAmount = EncryptionService.decrypt(schedule.dosageAmount.toString(), user.encryptionKey);
              decryptedSchedule.dosageAmount = parseFloat(decryptedAmount);
            } catch (error) {
              console.error('Failed to decrypt dosageAmount:', error);
            }
          }

          return decryptedSchedule;
        });
      }

      return decryptedMedicine;
    });

    const presetMedicinesMap = new Map();
    decryptedMedicines.forEach(med => {
      if (med.presetMedicine && med.presetMedicine.id) {
        presetMedicinesMap.set(med.presetMedicine.id, med.presetMedicine);
      }
    });

    res.status(200).json({
      success: true,
      data: decryptedMedicines,
      presetData: {
        medicines: Array.from(presetMedicinesMap.values())
      }
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(400).json({
      success: false,
      error: { message: 'Unable to fetch user medicines' }
    });
  }
};


export const updateUserMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

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

    const medicine = await prisma.userMedicine.update({
      where: { id, userId },
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

    res.locals.data = medicine;
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update medicine' });
  }
};
