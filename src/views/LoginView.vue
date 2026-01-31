<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="https://primefaces.org/cdn/primevue/images/logo.svg" alt="Logo" class="logo" />
                <h1>Welcome Back</h1>
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

                <div v-if="error" class="error-message">
                    {{ error }}
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
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
    loading.value = true;
    error.value = '';

    try {
        await authStore.login(username.value, password.value);
        // Store handles theme application and navigation
    } catch (err: any) {
        error.value = err.message || 'An error occurred during login';
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
