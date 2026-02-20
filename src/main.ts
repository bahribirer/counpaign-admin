import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import Tooltip from 'primevue/tooltip';
import { ThemeService } from './services/theme.service';
import './style.css';

import App from './App.vue';
import router from './router';
import { setupFetchInterceptor } from './plugins/fetchInterceptor';

// Apply Fetch Interceptor before mounting
setupFetchInterceptor();

// Initialize Theme Immediately to prevent FOUC
try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.theme) {
            ThemeService.applyTheme(user.theme);
        }
    }
} catch (e) {
    console.error('Failed to load initial theme', e);
}

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: 'none'  // Force light mode always
        }
    },
    ripple: true
});
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);

app.mount('#app');