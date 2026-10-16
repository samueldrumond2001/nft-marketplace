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
    rollupOptions: {
      output: {
        /*
         * Separa o que muda do que não muda. O bloco de vendor é estável
         * entre deploys, então sobrevive ao cache do navegador quando o
         * código da aplicação muda; junto, qualquer correção invalidava
         * 500KB. Também tira o MSW do caminho crítico do primeiro paint.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          /*
           * Só o MSW sai do caminho crítico.
           *
           * Separar React e o router também parecia boa ideia e quebrou a
           * aplicação: a ordem de inicialização entre os blocos deixa de ser
           * garantida. E o socket.io não pode entrar aqui: o engine.io
           * guarda `globalThis.WebSocket` ao ser avaliado, então ficar no
           * mesmo bloco do MSW o faria pegar o WebSocket nativo antes da
           * troca — nenhum evento mockado chegaria.
           */
          if (id.includes('node_modules/msw') || id.includes('@mswjs')) return 'mocks'
          return undefined
        },
      },
    },
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
