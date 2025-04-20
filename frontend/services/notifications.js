import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Function to register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  return token;
}

// Function to send the token to your backend
export async function sendTokenToBackend(token, userId) {
  try {
    // Replace with your API endpoint
    const response = await fetch('YOUR_API_ENDPOINT/update-push-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        pushToken: token,
      }),
    });
    
    const data = await response.json();
    console.log('Token registered with backend:', data);
    return data;
  } catch (error) {
    console.error('Error sending token to backend:', error);
    return null;
  }
}

// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Configure how notifications appear when app is in foreground
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// // Register for push notifications
// export async function registerForPushNotificationsAsync() {
//   let token;
  
//   if (Platform.OS === 'android') {
//     await Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: '#FF231F7C',
//     });
//   }

//   if (Device.isDevice) {
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;
    
//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }
    
//     if (finalStatus !== 'granted') {
//       console.log('Failed to get push token for push notification!');
//       return null;
//     }
    
//     token = (await Notifications.getExpoPushTokenAsync()).data;
    
//     // Store token locally
//     await AsyncStorage.setItem('pushToken', token);
//   } else {
//     console.log('Must use physical device for Push Notifications');
//     return null;
//   }

//   return token;
// }

// // Schedule a local notification
// export async function scheduleLocalNotification(title, body, data = {}) {
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title,
//       body,
//       data,
//     },
//     trigger: { seconds: 1 },
//   });
// }

// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Notification config
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// // Register for push notifications
// export async function registerForPushNotificationsAsync() {
//   let token;

//   if (Platform.OS === 'android') {
//     await Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: '#FF231F7C',
//     });
//   }

//   if (Device.isDevice) {
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== 'granted') {
//       console.log('❌ Failed to get push token for push notification!');
//       return null;
//     }

//     token = (await Notifications.getExpoPushTokenAsync()).data;
//     await AsyncStorage.setItem('pushToken', token);
//     console.log('✅ Push token stored locally:', token);
//   } else {
//     console.log('❌ Must use physical device for Push Notifications');
//     return null;
//   }

//   return token;
// }

// // Schedule a local notification
// export async function scheduleLocalNotification(title, body, data = {}) {
//   console.log('📅 Scheduling local notification:', { title, body });
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title,
//       body,
//       data,
//       channelId: 'default',
//     },
//     trigger: { seconds: 1 },
//   });
// }
