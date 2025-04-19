// app/index.js
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function Index() {
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
        const token = await AsyncStorage.getItem('userToken'); 
      console.log('Token:', token); // Debugging line
      setRedirectPath(token ? '/(main)' : '/login');
    };
    checkAuth();
  }, []);

  if (!redirectPath) {
    return null; // or a loading spinner
  }

  return <Redirect href={redirectPath} />;
}
