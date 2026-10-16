import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { mockApi } from './plugins/mock-api'

export default defineConfig({
  plugins: [
    // precisa vir antes do plugin do react para gerar a árvore de rotas
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    mockApi(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: true,
  },
  server: {
    port: 5174,
    host: true,
  },
  preview: {
    port: 4174,
    host: true,
  },
})
