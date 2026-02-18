<script setup lang="ts">
import { useAuthStore } from './stores/auth.store';
import { ThemeService } from './services/theme.service';
import { watch, ref, onMounted } from 'vue';
import Toast from 'primevue/toast';
import CoffeeLoader from './components/CoffeeLoader.vue';

const authStore = useAuthStore();
const isLoading = ref(true);

// Watch for theme changes (on login/logout)
watch(
  () => authStore.currentTheme,
  (newTheme) => {
    ThemeService.applyTheme(newTheme);
  },
  { immediate: true, flush: 'sync' }
);

onMounted(() => {
  // Simulate initial loading for the coffee cup effect
  setTimeout(() => {
    isLoading.value = false;
  }, 2500);
});
</script>

<template>
  <CoffeeLoader v-if="isLoading" />
  <router-view v-show="!isLoading" />
  <Toast />
</template>

<style>
/* ... existing styles ... */
body {
  margin: 0;
  background-color: var(--surface-ground);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
