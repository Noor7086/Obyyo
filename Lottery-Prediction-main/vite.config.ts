import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Force inject the variable to avoid .env loading issues
    'import.meta.env.VITE_PAYPAL_CLIENT_ID': JSON.stringify("ATUnS0mGv-nNpE7-IJxHsNCsCtfW8EzBc2jti4-duiiKcRd2_BMHsV1syU4D87caNKhxBhWb3NnGBWcO"),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

