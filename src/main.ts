import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import { ThemeService } from './services/theme.service';
import './style.css';

import App from './App.vue';
import router from './router';

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
        preset: Aura
    },
    ripple: true
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');