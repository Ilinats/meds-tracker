import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync, sendTokenToBackend } from '../services/notifications';

export default function NotificationManager() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Setup notifications when component mounts
    setupNotifications();

    return () => {
      // Clean up listeners when component unmounts
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    // Get user info
    const userId = await AsyncStorage.getItem('userId');
    const existingToken = await AsyncStorage.getItem('pushToken');
    
    // Register for push notifications
    const token = await registerForPushNotificationsAsync();
    
    if (token && userId && token !== existingToken) {
      // Send token to backend if it's new or different
      await sendTokenToBackend(token, userId);
      await AsyncStorage.setItem('pushToken', token);
    }

    // Handle notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle user tapping on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // You can add navigation logic here if needed
    });
  };

  // This component doesn't render anything
  return null;
}

import React, { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationManager() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const appState = useRef(AppState.currentState);
  const [_, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    // Setup notifications when component mounts
    setupNotifications();

    // Set up AppState listener to check for notifications when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        checkForNotifications();
      }
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      // Clean up listeners when component unmounts
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription.remove();
    };
  }, []);

  const setupNotifications = async () => {
    // Register for push notifications
    await registerForPushNotificationsAsync();

    // Handle notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle user tapping on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });
  };

  const checkForNotifications = async () => {
    // This is where you would normally poll your backend for notifications
    // For now, we'll just simulate it with local logic
    
    // Check if medicine reminder is needed
    const medicines = await AsyncStorage.getItem('medicines');
    if (medicines) {
      const medicineList = JSON.parse(medicines);
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes().toString().padStart(2, '0')}`;
      const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
      
      // Check each medicine schedule
      medicineList.forEach(medicine => {
        if (medicine.schedules) {
          medicine.schedules.forEach(schedule => {
            if (schedule.isActive && 
                schedule.timesOfDay.includes(currentTime) && 
                schedule.repeatDays.includes(currentDay)) {
              // Schedule a local notification
              Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Time to Take Your Medicine',
                  body: `Please take ${schedule.dosageAmount} ${medicine.unit} of ${medicine.name}`,
                },
                trigger: null, // Show immediately
              });
            }
          });
        }
        
        // Check for low stock
        if (medicine.quantity <= 5) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Low Medicine Stock',
              body: `Your ${medicine.name} is running low (${medicine.quantity} ${medicine.unit} remaining)`,
            },
            trigger: null,
          });
        }
        
        // Check for expiry
        const expiryDate = new Date(medicine.expiryDate);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        if (expiryDate <= sevenDaysFromNow && expiryDate >= now) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Medicine Expiring Soon',
              body: `Your ${medicine.name} will expire in 7 days`,
            },
            trigger: null,
          });
        }
      });
    }
  };

  // This component doesn't render anything
  return null;
}

// import React, { useEffect, useRef, useState } from 'react';
// import * as Notifications from 'expo-notifications';
// import { registerForPushNotificationsAsync, sendTokenToBackend } from '../services/notifications';
// import { AppState } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export default function NotificationManager() {
//   const notificationListener = useRef();
//   const responseListener = useRef();
//   const appState = useRef(AppState.currentState);
//   const [_, setAppStateVisible] = useState(appState.current);

//   useEffect(() => {
//     setupNotifications();

//     const subscription = AppState.addEventListener('change', nextAppState => {
//       if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
//         checkForNotifications();
//       }
//       appState.current = nextAppState;
//       setAppStateVisible(appState.current);
//     });

//     return () => {
//       if (notificationListener.current) {
//         Notifications.removeNotificationSubscription(notificationListener.current);
//       }
//       if (responseListener.current) {
//         Notifications.removeNotificationSubscription(responseListener.current);
//       }
//       subscription.remove();
//     };
//   }, []);

//   const setupNotifications = async () => {
//     const userId = await AsyncStorage.getItem('userId');
//     const existingToken = await AsyncStorage.getItem('pushToken');

//     const token = await registerForPushNotificationsAsync();

//     if (token && userId && token !== existingToken) {
//       await sendTokenToBackend(token, userId);
//       await AsyncStorage.setItem('pushToken', token);
//     }

//     notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
//       console.log('🔔 Notification received:', notification);
//     });

//     responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
//       console.log('👉 Notification tapped:', response);
//       // Optionally add navigation logic here
//     });
//   };

//   const checkForNotifications = async () => {
//     const medicines = await AsyncStorage.getItem('medicines');
//     if (!medicines) return;

//     const medicineList = JSON.parse(medicines);
//     const now = new Date();
//     const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
//       .getMinutes()
//       .toString()
//       .padStart(2, '0')}`;
//     const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

//     medicineList.forEach(medicine => {
//       medicine.schedules?.forEach(schedule => {
//         if (
//           schedule.isActive &&
//           schedule.timesOfDay.includes(currentTime) &&
//           schedule.repeatDays.includes(currentDay)
//         ) {
//           Notifications.scheduleNotificationAsync({
//             content: {
//               title: '💊 Time to Take Your Medicine',
//               body: `Take ${schedule.dosageAmount} ${medicine.unit} of ${medicine.name}`,
//               channelId: 'default',
//             },
//             trigger: null, // Show immediately
//           });
//         }
//       });
//     });
//   };

//   return null; // No UI
// }
