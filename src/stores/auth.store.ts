import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import router from '../router';

export const useAuthStore = defineStore('auth', () => {
    // Initialize user from localStorage if exists
    const storedUser = localStorage.getItem('user');
    const user = ref<UserInfo | null>(storedUser ? JSON.parse(storedUser) : null);
    const isLoading = ref(false);
    const error = ref('');

    const isAuthenticated = computed(() => !!user.value);
    const currentTheme = computed(() => user.value?.theme || 'default');

    async function login(username: string, password: string) {
        isLoading.value = true;
        error.value = '';

        try {
            const loggedUser = await AuthService.login(username, password);
            console.log('LOGIN DEBUG: Received User:', loggedUser);

            if (loggedUser.role === 'business' && !loggedUser.businessId) {
                console.error('CRITICAL: Business user missing businessId!');
            }

            user.value = loggedUser;
            localStorage.setItem('user', JSON.stringify(loggedUser));

            // Force apply theme IMMEDIATELY and SYNCHRONOUSLY
            if (loggedUser.theme) {
                ThemeService.applyTheme(loggedUser.theme);
                // Force a small delay to ensure CSS variables are applied
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Navigate to dashboard
            router.push('/dashboard');
        } catch (e: any) {
            error.value = e.message || 'Login failed';
        } finally {
            isLoading.value = false;
        }
    }

    function logout() {
        user.value = null;
        localStorage.removeItem('user');
        AuthService.logout();
        router.push('/login');
    }

    return {
        user,
        isLoading,
        error,
        isAuthenticated,
        currentTheme,
        login,
        logout,
    };
});
