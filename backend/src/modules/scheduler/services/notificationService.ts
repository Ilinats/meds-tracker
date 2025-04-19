import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaClient } from '../../../../prisma/app/generated/prisma/client';

const prisma = new PrismaClient();
const expo = new Expo();

export class NotificationService {
  static async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.pushToken) return;

      const message: ExpoPushMessage = {
        to: user.pushToken,
        sound: 'default',
        title,
        body,
        data
      };

      await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async sendMedicineReminder(scheduleId: string) {
    try {
      const schedule = await prisma.medicineSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          userMedicine: true,
          user: true
        }
      });

      if (!schedule) return;

      await this.sendPushNotification(
        schedule.userId,
        'Time to Take Your Medicine',
        `Please take ${schedule.dosageAmount} ${schedule.userMedicine.unit} of ${schedule.userMedicine.name}`
      );
    } catch (error) {
      console.error('Error sending medicine reminder:', error);
    }
  }
}
