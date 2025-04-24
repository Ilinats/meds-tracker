//import { PrismaClient } from '../../../../prisma/app/generated/prisma/client';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class ScheduleChecker {
  static async checkMedicineSchedules() {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

      const schedules = await prisma.medicineSchedule.findMany({
        where: {
          isActive: true,
          timesOfDay: {
            has: currentTime
          },
          repeatDays: {
            has: currentDay
          }
        },
        include: {
          userMedicine: true,
          user: true
        }
      });

      for (const schedule of schedules) {
        await NotificationService.sendMedicineReminder(schedule.id);
      }
    } catch (error) {
      console.error('Error checking medicine schedules:', error);
    }
  }

  static async checkLowStockAndExpiry() {
    try {
      const lowStockMedicines = await prisma.userMedicine.findMany({
        where: {
          quantity: {
            lte: 5
          }
        },
        include: {
          user: true
        }
      });

      for (const medicine of lowStockMedicines) {
        await NotificationService.sendPushNotification(
          medicine.userId,
          'Low Medicine Stock',
          `Your ${medicine.name} is running low (${medicine.quantity} ${medicine.unit} remaining)`
        );
      }

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringMedicines = await prisma.userMedicine.findMany({
        where: {
          expiryDate: {
            lte: sevenDaysFromNow,
            gte: new Date()
          }
        },
        include: {
          user: true
        }
      });

      for (const medicine of expiringMedicines) {
        await NotificationService.sendPushNotification(
          medicine.userId,
          'Medicine Expiring Soon',
          `Your ${medicine.name} will expire in 7 days`
        );
      }
    } catch (error) {
      console.error('Error checking low stock and expiry:', error);
    }
  }
}