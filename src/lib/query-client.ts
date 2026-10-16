import { QueryClient } from '@tanstack/react-query'

import { ApiError } from './http'

// staleTime é por query. Default 0: esquecer custa um refetch, não um preço errado.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        const status = error instanceof ApiError ? error.status : 0
        // 4xx não melhora com insistência
        if (status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})

/** Num lugar só, pra não virar número mágico espalhado. */
export const STALE = {
  catalog: 60_000,
  nftDetail: 30_000,
  session: 5 * 60_000,
  /** dinheiro a pagar: sempre fresco */
  money: 0,
} as const
