import axios from 'axios';
import router from '../router';
import { useAuthStore } from '../stores/auth.store';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor definition
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for catching 401s and refreshing token
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call refresh endpoint directly using fetch to avoid loop
                const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Refresh failed');
                }

                // Update token in local storage
                localStorage.setItem('token', data.token);

                // Update auth store if initialized
                const authStore = useAuthStore();
                authStore.token = data.token;

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                return api(originalRequest);

            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                const authStore = useAuthStore();
                authStore.logout();
                router.push('/login');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
