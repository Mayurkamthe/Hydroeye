import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, AuthResponse, UserInfo, UserRole } from '../services/authService';
import { setAuthToken, clearAuthToken, getAuthToken } from '../api/config';

interface AuthContextType {
    user: UserInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (fullName: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await getAuthToken();
            if (token) {
                const userInfo = await AuthService.getCurrentUser();
                setUser(userInfo);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await clearAuthToken();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await AuthService.login({ email, password });
        await setAuthToken(response.token);
        const userInfo = await AuthService.getCurrentUser();
        setUser(userInfo);
    };

    // Public registration is CITIZEN-only
    const register = async (fullName: string, email: string, password: string) => {
        const response = await AuthService.register({ fullName, email, password, role: 'CITIZEN' });
        await setAuthToken(response.token);
        const userInfo = await AuthService.getCurrentUser();
        setUser(userInfo);
    };

    const logout = async () => {
        await clearAuthToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
