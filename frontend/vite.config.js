import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Keep shared development configuration at the repository root.
  envDir: '..',
  plugins: [react(), tailwindcss()],
})
