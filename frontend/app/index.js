import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { authApi } from '../services/api';

async function registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('Requesting push notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions!');
      return null;
    }
    
    console.log('Push notification permissions granted!');
    
    try {
      console.log('Getting Expo push token...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "56fefc22-74f4-4d49-8266-1cfad06d2a15",
      });
      const pushToken = tokenData.data;
      
      console.log('Got Expo push token:', pushToken);
      
      console.log('Registering token with backend...');
      const response = await authApi.registerPushToken(pushToken);
      console.log('Backend registration response:', response);
      
      return pushToken;
    } catch (error) {
      console.error('Error in push token registration:', error);
      if (error.response) {
        console.error('Error response from server:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      return null;
    }
  }

function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export default function Index() {
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      AsyncStorage.clear();
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token:', token);
      
      //if (token) {
        setupNotifications();
        await registerForPushNotifications();
      //}
      
      setRedirectPath(token ? '/(main)' : '/login');
    };

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received!', notification);
    });
    
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received!', response);
      // Handle notification tap/interaction here
    });

    checkAuth();

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  if (!redirectPath) {
    return null;
  }

  return <Redirect href={redirectPath} />;
}