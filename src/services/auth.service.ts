import { type UserInfo } from '../types/auth.types';

const API_URL = 'http://localhost:5001/api/auth';

export class AuthService {

    static async login(username: string, password: string): Promise<UserInfo> {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token
            localStorage.setItem('token', data.token);

            return data.user;
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    }

    static logout(): void {
        localStorage.removeItem('token');
    }
}
