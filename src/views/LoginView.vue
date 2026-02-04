<template>
    <div class="login-container">
        <Toast /> 
        
        <!-- [NEW] Error Dialog -->
        <Dialog v-model:visible="showErrorDialog" modal :style="{ width: '400px' }" :closable="false" class="error-dialog">
            <template #header>
                <div class="flex align-items-center gap-2">
                    <i class="pi pi-times-circle text-red-500 text-2xl"></i>
                    <span class="font-bold text-xl">Giriş Başarısız</span>
                </div>
            </template>
            <div class="flex flex-column align-items-center p-3 text-center">
                <p class="m-0 text-lg">E-posta veya şifre hatalı.</p>
                <p class="text-secondary mt-2 text-sm">Lütfen bilgilerinizi kontrol edip tekrar deneyin.</p>
            </div>
            <template #footer>
                <div class="flex justify-content-center w-full">
                    <Button label="Tamam" severity="danger" @click="showErrorDialog = false" class="w-full" />
                </div>
            </template>
        </Dialog>

        <div class="login-card">
            <div class="login-header">
                <img src="/logo.png" alt="Counpaign" class="logo" />
                <h1>Yönetim Paneli</h1>
                <p>Please sign in to your account</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <InputText id="username" v-model="username" class="w-full" placeholder="Enter your username" />
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <Password id="password" v-model="password" :feedback="false" toggleMask class="w-full" inputClass="w-full" placeholder="Enter your password" />
                </div>

                <div class="form-actions">
                    <Button type="submit" label="Sign In" :loading="loading" class="w-full" />
                </div>


            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog'; // [NEW]
import Toast from 'primevue/toast'; 
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const loading = ref(false);
const showErrorDialog = ref(false); // [NEW]

const handleLogin = async () => {
    loading.value = true;
    try {
        await authStore.login(username.value, password.value);
        
        // [FIX] Store swallows error, so we must check it manually
        if (authStore.error) {
            throw new Error(authStore.error);
        }
        
        // Store handles theme application and navigation
    } catch (err: any) {
        // [NEW] Show Dialog instead of Toast
        showErrorDialog.value = true;
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--surface-ground);
    background-image: radial-gradient(circle at top right, var(--primary-color-200), transparent 40%),
                      radial-gradient(circle at bottom left, var(--primary-color-200), transparent 40%);
}

.login-card {
    background: var(--surface-card);
    padding: 3rem;
    border-radius: var(--border-radius-xl);
    box-shadow: var(--box-shadow);
    width: 100%;
    max-width: 450px;
    border: 1px solid var(--surface-border);
}

.login-header {
    text-align: center;
    margin-bottom: 2.5rem;
}

.logo {
    height: 48px;
    margin-bottom: 1rem;
}

.login-header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
}

.login-header p {
    color: var(--text-color-secondary);
    margin: 0;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: 500;
    color: var(--text-color);
}

.error-message {
    color: var(--red-500);
    text-align: center;
    font-size: 0.875rem;
    margin-top: 0.5rem;
}

:deep(.p-password-input) {
    width: 100%;
}
</style>
