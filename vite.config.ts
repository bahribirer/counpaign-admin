import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  esbuild: {
    pure: ['console.log', 'console.debug', 'console.info'],
  },
  server: {
    port: 5173,
    host: true, // ağ üzerinden erişim için (aynı ağdaki telefon/tablet testi)
    proxy: {
      '/api': {
        target: 'https://counpaign.com',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://counpaign.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
})
