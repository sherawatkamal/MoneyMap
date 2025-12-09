// vite.config.ts
//
// Kamal Sherawat Virginia Tech August 22, 2025
//
// Vite build configuration file for React application with development server settings.
//

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
