import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

const TOKEN_EXPIRATION_HOURS = 4;

type User = {
  id: string;
  username: string;
};

type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkTokenExpiration = async (tokenTimestamp: string): Promise<boolean> => {
    const tokenTime = new Date(tokenTimestamp).getTime();
    const currentTime = new Date().getTime();
    const hoursElapsed = (currentTime - tokenTime) / (1000 * 60 * 60);
    return hoursElapsed < TOKEN_EXPIRATION_HOURS;
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        const tokenTimestamp = await AsyncStorage.getItem('tokenTimestamp');

        if (userToken && userData && tokenTimestamp) {
          const isTokenValid = await checkTokenExpiration(tokenTimestamp);
          
          if (isTokenValid) {
            setUser(JSON.parse(userData));
            setIsLoggedIn(true);
          } else {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('tokenTimestamp');
            setUser(null);
            setIsLoggedIn(false);
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authApi.login(username, password);
      
      if (result.success) {
        const currentTime = new Date().toISOString();
        await AsyncStorage.setItem('userToken', result.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.data.user));
        await AsyncStorage.setItem('tokenTimestamp', currentTime);
        setUser(result.data.user);
        setIsLoggedIn(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('tokenTimestamp');
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      isLoggedIn,
      setIsLoggedIn,
      login,
      logout,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};