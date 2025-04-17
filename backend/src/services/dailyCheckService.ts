import schedule from 'node-schedule';
import { PrismaClient } from '../../prisma/app/generated/prisma/client';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class DailyCheckService {
  static async checkLowStock() {
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
        await NotificationService.sendPushNotification({
          userId: medicine.userId,
          title: 'Low Medicine Stock Alert',
          body: `Your ${medicine.name} is running low (${medicine.quantity} ${medicine.unit} remaining)`,
          data: {
            type: 'low_stock',
            medicineId: medicine.id
          }
        });
      }
    } catch (error) {
      console.error('Error in checkLowStock:', error);
    }
  }

  static async checkExpiringMedicines() {
    try {
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
        const daysUntilExpiry = Math.ceil(
          (medicine.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        await NotificationService.sendPushNotification({
          userId: medicine.userId,
          title: 'Medicine Expiring Soon',
          body: `Your ${medicine.name} will expire in ${daysUntilExpiry} days`,
          data: {
            type: 'expiring',
            medicineId: medicine.id
          }
        });
      }
    } catch (error) {
      console.error('Error in checkExpiringMedicines:', error);
    }
  }

  static async checkDailySchedule() {
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
        await NotificationService.sendPushNotification({
          userId: schedule.userId,
          title: 'Medicine Reminder',
          body: `Time to take ${schedule.userMedicine.name} (${schedule.dosageAmount} ${schedule.userMedicine.unit})`,
          data: {
            type: 'schedule',
            medicineId: schedule.userMedicineId,
            scheduleId: schedule.id
          }
        });
      }
    } catch (error) {
      console.error('Error in checkDailySchedule:', error);
    }
  }
}