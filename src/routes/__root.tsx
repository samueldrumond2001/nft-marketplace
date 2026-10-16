import type { QueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { BottomNav } from '@/components/layout/BottomNav'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { AuthDialog, meQuery, type AuthMode } from '@/features/auth'
import { cartItemCount, cartQuery } from '@/features/cart'
import { useConnectionStatus, useRealtime } from '@/features/realtime'

export interface RouterContext {
  queryClient: QueryClient
}

// O login é um parâmetro de busca, não uma rota própria. No Figma ele aparece
// como modal sobre a página atual — assim é uma implementação só, que serve
// para o modal do desktop e para a tela cheia do mobile, e o estado vai na URL.
const searchSchema = z.object({
  auth: z.enum(['login', 'register']).optional().catch(undefined),
})

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: searchSchema,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const { auth } = Route.useSearch()
  const navigate = useNavigate()
  const { data: cart } = useQuery(cartQuery)
  const { data: user } = useQuery(meQuery)
  const connection = useConnectionStatus()
  useRealtime()

  const setAuth = (mode: AuthMode | undefined) =>
    void navigate({ to: '.', search: (prev) => ({ ...prev, auth: mode }), replace: true })

  return (
    <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
      <a
        href="#conteudo"
        className="bg-primary text-ink focus:rounded-btn sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>

      {connection === 'offline' && <OfflineBanner />}

      <Header
        cartCount={cartItemCount(cart)}
        user={user ?? null}
        onSignIn={() => setAuth('login')}
      />

      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <BottomNav cartCount={cartItemCount(cart)} />

      {auth && (
        <AuthDialog
          mode={auth}
          onModeChange={setAuth}
          onClose={() => setAuth(undefined)}
          onSuccess={() => setAuth(undefined)}
        />
      )}
    </div>
  )
}

/*
 * Sem socket os preços e o estado dos pedidos param de chegar. A página
 * continua utilizável — o REST responde —, então o aviso informa em vez de
 * bloquear. `role="status"` e não `alert`: é condição, não erro de ação.
 */
function OfflineBanner() {
  return (
    <div
      role="status"
      className="bg-surface-dark text-text-secondary border-border-soft border-b px-4 py-2 text-center text-xs"
    >
      <span className="text-text-accent font-bold">Sem conexão em tempo real.</span> Preços e status
      de pedido podem estar desatualizados; recarregue para conferir.
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-24 text-center">
      <h1 className="text-heading font-bold">Página não encontrada</h1>
      <p className="text-text-secondary mt-3 text-sm">
        O endereço acessado não existe ou foi movido.
      </p>
    </div>
  )
}
