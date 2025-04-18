import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from '../hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProvider } from '../context/UserContext';
import { MedicationProvider } from '../context/MedicationContext';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        setIsLoggedIn(userToken !== null);
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (loaded && !isLoading) SplashScreen.hideAsync();
  }, [loaded, isLoading]);

  if (!loaded || isLoading) return null;

  return (
    <UserProvider>
      <MedicationProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            {isLoggedIn ? (
              <Stack.Screen name="(main)/index" />
            ) : (
              <Stack.Screen
                name="login"
                initialParams={{ setIsLoggedIn }}
              />
            )}
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </MedicationProvider>
    </UserProvider>
  );
}
