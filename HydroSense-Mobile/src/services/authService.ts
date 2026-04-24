import api from '../api/config';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    organization?: string;
    designation?: string;
    role: 'CITIZEN' | 'AUTHORITY';
}

export interface AuthResponse {
    token: string;
    tokenType: string;
    expiresIn: number;
    user: UserInfo;
}

export type UserRole = 'CITIZEN' | 'AUTHORITY' | 'SUPER_ADMIN';

export interface UserInfo {
    id: number;
    fullName: string;
    email: string;
    role: UserRole;
    organization?: string;
    designation?: string;
}

export const AuthService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    // Public registration — CITIZEN only
    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/register', { ...userData, role: 'CITIZEN' });
        return response.data;
    },

    getCurrentUser: async (): Promise<UserInfo> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // Super Admin: create an authority account
    createAuthorityAccount: async (userData: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/super-admin/create-authority', {
            ...userData,
            role: 'AUTHORITY',
        });
        return response.data;
    },

    // Super Admin: list all authority users
    listAuthorityUsers: async (): Promise<UserInfo[]> => {
        const response = await api.get('/auth/super-admin/authorities');
        return response.data;
    },

    // Super Admin: deactivate a user
    deactivateUser: async (userId: number): Promise<void> => {
        await api.put(`/auth/super-admin/deactivate/${userId}`);
    },
};

export default AuthService;
