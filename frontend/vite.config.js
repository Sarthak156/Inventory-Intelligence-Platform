import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Keep shared development configuration at the repository root.
  envDir: '..',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/api -> http://localhost:8000/api
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
