import api from '../api/config';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    role: 'CITIZEN' | 'AUTHORITY';
}

export interface AuthResponse {
    token: string;
    role: string;
    fullName: string;
    email: string;
}

export interface UserInfo {
    id: number;
    fullName: string;
    email: string;
    role: 'CITIZEN' | 'AUTHORITY';
}

export const AuthService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    getCurrentUser: async (): Promise<UserInfo> => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

export default AuthService;
