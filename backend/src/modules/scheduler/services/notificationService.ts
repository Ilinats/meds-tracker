// import { Expo, ExpoPushMessage } from 'expo-server-sdk';
// import { PrismaClient } from '../../../../prisma/app/generated/prisma/client';

// const prisma = new PrismaClient();
// const expo = new Expo();

// export class NotificationService {
//   static async sendPushNotification(userId: string, title: string, body: string, data?: any) {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: userId }
//       });

//       if (!user?.pushToken) return;

//       const message: ExpoPushMessage = {
//         to: user.pushToken,
//         sound: 'default',
//         title,
//         body,
//         data
//       };

//       await expo.sendPushNotificationsAsync([message]);
//     } catch (error) {
//       console.error('Error sending notification:', error);
//     }
//   }

//   static async sendMedicineReminder(scheduleId: string) {
//     try {
//       const schedule = await prisma.medicineSchedule.findUnique({
//         where: { id: scheduleId },
//         include: {
//           userMedicine: true,
//           user: true
//         }
//       });

//       if (!schedule) return;

//       await this.sendPushNotification(
//         schedule.userId,
//         'Time to Take Your Medicine',
//         `Please take ${schedule.dosageAmount} ${schedule.userMedicine.unit} of ${schedule.userMedicine.name}`
//       );
//     } catch (error) {
//       console.error('Error sending medicine reminder:', error);
//     }
//   }
// }


import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaClient } from '../../../../prisma/app/generated/prisma/client';

const prisma = new PrismaClient();
const expo = new Expo();

export class NotificationService {
  static async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user?.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return;
      }

      // Validate that the token is actually an Expo push token
      if (!Expo.isExpoPushToken(user.pushToken)) {
        console.error(`Push token ${user.pushToken} is not a valid Expo push token`);
        return;
      }

      const message: ExpoPushMessage = {
        to: user.pushToken,
        sound: 'default',
        title,
        body,
        data: data || {}
      };

      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      // Send the chunks to the Expo push notification service
      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          
          // Check for errors in the tickets
          ticketChunk.forEach((ticket, index) => {
            if (ticket.status === 'error') {
              console.error(`Error sending notification to ${chunk[index].to}:`, ticket.message);
              
              // Handle specific error types
              if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                // The user's push token is no longer valid, you might want to remove it
                this.handleInvalidToken(user.id);
              }
            }
          });
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Helper method to handle invalid tokens
  static async handleInvalidToken(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { pushToken: null }
      });
      console.log(`Removed invalid push token for user ${userId}`);
    } catch (error) {
      console.error('Error removing invalid token:', error);
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

      if (!schedule) {
        console.log(`Schedule ${scheduleId} not found`);
        return;
      }

      await this.sendPushNotification(
        schedule.userId,
        'Time to Take Your Medicine',
        `Please take ${schedule.dosageAmount} ${schedule.userMedicine.unit} of ${schedule.userMedicine.name}`,
        { scheduleId, medicineId: schedule.userMedicine.id, type: 'medicine_reminder' }
      );
    } catch (error) {
      console.error('Error sending medicine reminder:', error);
    }
  }
}