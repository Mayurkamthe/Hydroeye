import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use localhost for iOS simulator, special IP for Android emulator
const BASE_URL = Platform.OS === 'android'
    ? 'https://5782b7eeab41.ngrok-free.app/api/v1'
    : 'https://5782b7eeab41.ngrok-free.app/api/v1';

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token management
const TOKEN_KEY = 'auth_token';

export const setAuthToken = async (token: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
};

// Request interceptor to add token
api.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await clearAuthToken();
            // Could trigger navigation to login here
        }
        return Promise.reject(error);
    }
);

export default api;
