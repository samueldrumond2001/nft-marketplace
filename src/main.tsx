import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { setApiReady } from '@/lib/http'
import { queryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'
import '@/styles/globals.css'

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  // o cache é do Query; dois caches seriam dois lugares pra invalidar
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Não há backend: o MSW é a API, inclusive em produção.
async function enableMocking() {
  // sem o catch a página fica em branco, porque o render está depois do await
  try {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  } catch (error) {
    console.error('[kurio] MSW não iniciou; as requisições vão falhar.', error)
  }
}

function render() {
  const container = document.getElementById('root')
  if (!container) throw new Error('elemento #root não encontrado')

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

// a casca não espera o MSW; quem espera é o interceptor das requisições
setApiReady(enableMocking())
render()
