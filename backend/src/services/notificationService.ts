import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaClient } from '../../prisma/app/generated/prisma/client';

const expo = new Expo();
const prisma = new PrismaClient();

interface NotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  static async sendPushNotification({ userId, title, body, data }: NotificationData) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.pushToken) return;

      if (!Expo.isExpoPushToken(user.pushToken)) {
        console.error(`Invalid Expo push token ${user.pushToken}`);
        return;
      }

      const message: ExpoPushMessage = {
        to: user.pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high'
      };

      const chunks = expo.chunkPushNotifications([message]);
      
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }
    } catch (error) {
      console.error('Error in sendPushNotification:', error);
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

      await this.sendPushNotification({
        userId: schedule.userId,
        title: 'Time to Take Your Medicine',
        body: `Please take ${schedule.dosageAmount} ${schedule.userMedicine.unit} of ${schedule.userMedicine.name}`,
        data: {
          type: 'MEDICINE_REMINDER',
          scheduleId: schedule.id,
          medicineId: schedule.userMedicineId
        }
      });
    } catch (error) {
      console.error('Error in sendMedicineReminder:', error);
    }
  }
}