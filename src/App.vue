<script setup lang="ts">
import { useAuthStore } from './stores/auth.store';
import { ThemeService } from './services/theme.service';
import { watch } from 'vue';
import Toast from 'primevue/toast';

const authStore = useAuthStore();

// Watch for theme changes (on login/logout)
watch(
  () => authStore.currentTheme,
  (newTheme) => {
    ThemeService.applyTheme(newTheme);
  },
  { immediate: true, flush: 'sync' }
);
</script>

<template>
  <router-view />
  <Toast />
</template>

<style>
body {
  margin: 0;
  background-color: var(--surface-ground);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
