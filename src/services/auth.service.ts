import { type UserInfo } from '../types/auth.types';
import api from './api';

export class AuthService {

    static async login(username: string, password: string): Promise<UserInfo> {
        try {
            const response = await api.post(`/auth/admin/login`, { username, password });
            const data = response.data;

            // Store tokens
            localStorage.setItem('token', data.token);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }

            return data.user;
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    }

    static logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }
}
