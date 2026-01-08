import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Force inject the variable to avoid .env loading issues
    'import.meta.env.VITE_PAYPAL_CLIENT_ID': JSON.stringify("AedpuqKn9fKTF4VBBiQxp_R0eI2ejZUVcuYzLsxRw8KNIXuT960lA82HFIyuaQiXeV75AvtsccDogAqQ"),
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

