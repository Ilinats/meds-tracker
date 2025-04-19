import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';


// -----------------------
// Types
// -----------------------

interface User {
  email: string;
  password: string;
}

interface MedicineData {
  id?: string;
  name: string;
  category: string;
  unit: "PILLS" | "ML" | "MG" | "G";
  quantity: number;
  expiryDate: string | Date;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  dosagePerDay?: number | null;
  prescription?: string | null;
  presetMedicineId?: string | null;
  schedules?: Array<{
    timesOfDay: string[];
    repeatDays: string[];
    dosageAmount: number;
  }>;
}

interface QueryParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}
// -----------------------
// Query Keys
// -----------------------

export const queryKeys = {
  presetMedicines: 'presetMedicines',
  userMedicines: 'userMedicines',
  expiringMedicines: 'expiringMedicines',
  lowStockMedicines: 'lowStockMedicines',
};

// -----------------------
// API Setup
// -----------------------

const API_URL = 'http://157.245.21.183:80/api';
console.log(API_URL)

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Auto logout on 401
  apiClient.interceptors.response.use(
    response => response,
    async (error) => {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        // Optional: Redirect to login screen
      }
      return Promise.reject(error);
    }
  );

// -----------------------
// Auth API
// -----------------------

export const authApi = {
    login: async (username: string, password: string) => {
        try {
          const response = await apiClient.post('/auth/login', { username, password });
          return response.data;
        } catch (error) {
          if (error.response) {
            // Server responded with a status other than 2xx
            console.error('Error response:', error.response);
            throw error.response.data;
          } else if (error.request) {
            // No response was received
            console.error('Error request:', error.request);
            throw 'No response from server';
          } else {
            // General error (network error, etc.)
            console.error('Error message:', error.message);
            throw error.message;
          }
        }
      },
  
    register: async (userData: { username: string, password: string }) => {
      try {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    },
  
    useLogin() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ username, password }: { username: string, password: string }) => 
          authApi.login(username, password),
        onSuccess: async (data) => {
          if (data.data.token) {
            await AsyncStorage.setItem('userToken', data.data.token);
            await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
          }
        }
      });
    }
  };

// -----------------------
// Medicine API
// -----------------------

export const medicineApi = {
  getPresetMedicines: async (params?: QueryParams) => {
    const response = await apiClient.get('/medicines/presets', { params });
    return response.data.data;
  },

  getUserMedicines: async (params?: QueryParams) => {
    try
    {
      const response = await apiClient.get('/medicines/collection', { params });
      return response.data.data;
    }
    catch (error) {
        console.error('Error fetching user medicines:', error);
        if (error.response) {
            // Server responded with a status other than 2xx
            console.error('Error response:', error.response);
            throw error.response.data;
        } else if (error.request) {
            // No response was received
            console.error('Error request:', error.request);
            throw 'No response from server';
        } else {
            // General error (network error, etc.)
            console.error('Error message:', error.message);
            throw error.message;
        }
        }
  },

  addToCollection: async (medicineData: MedicineData) => {
    try {
      const response = await apiClient.post('/medicines/collection', medicineData);
      return response.data;
    } catch (error) {
      console.error('Error adding medicine to collection:', error);
      if (error.response) {
        // Server responded with a status other than 2xx
        console.error('Error response:', error.response);
        throw error.response.data;
      }
        if (error.request) {
            // No response was received
            console.error('Error request:', error.request);
            throw 'No response from server';
        }
    }
  },


  updateUserMedicine: async (id: string, medicineData: MedicineData) => {
    const response = await apiClient.put(`/collection/${id}`, medicineData);
    return response.data;
  },

  removeFromCollection: async (id: string) => {
    const response = await apiClient.delete(`/collection/${id}`);
    return response.data;
  },

  recordMedicineIntake: async (scheduleId: string, data?: { takenAt?: Date }) => {
    const response = await apiClient.post(`/intake/${scheduleId}`, data || {});
    return response.data;
  },

  getExpiringMedicines: async () => {
    const response = await apiClient.get('/expiring');
    return response.data.data;
  },

  getLowStockMedicines: async () => {
    const response = await apiClient.get('/low-stock');
    return response.data.data;
  },

  // -----------------------
  // React Query Hooks
  // -----------------------

  usePresetMedicines(params?: QueryParams) {
    return useQuery({
      queryKey: [queryKeys.presetMedicines, params],
      queryFn: () => medicineApi.getPresetMedicines(params),
    });
  },

  useUserMedicines(params?: QueryParams) {
    return useQuery({
      queryKey: [queryKeys.userMedicines, params],
      queryFn: () => medicineApi.getUserMedicines(params),
    });
  },

  useAddMedicine() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (medicineData: MedicineData) => medicineApi.addToCollection(medicineData),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.userMedicines] });
      }
    });
  },

  useUpdateMedicine() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: MedicineData }) =>
        medicineApi.updateUserMedicine(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.userMedicines] });
      }
    });
  },

  useRemoveMedicine() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => medicineApi.removeFromCollection(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.userMedicines] });
      }
    });
  },

  useRecordIntake() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ scheduleId, data }: { scheduleId: string; data?: { takenAt?: Date } }) =>
        medicineApi.recordMedicineIntake(scheduleId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.userMedicines] });
      }
    });
  },

  useExpiringMedicines() {
    return useQuery({
      queryKey: [queryKeys.expiringMedicines],
      queryFn: () => medicineApi.getExpiringMedicines(),
    });
  },

  useLowStockMedicines() {
    return useQuery({
      queryKey: [queryKeys.lowStockMedicines],
      queryFn: () => medicineApi.getLowStockMedicines(),
    });
  }
};