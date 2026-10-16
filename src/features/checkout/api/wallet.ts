import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { ApiError, http } from '@/lib/http'

export const WALLET_SESSION_KEY = ['wallet-session'] as const

const walletSessionSchema = z.object({
  wallet: z.object({ address: z.string(), walletType: z.string() }).nullable(),
})

export type WalletSession = z.infer<typeof walletSessionSchema>['wallet']

async function request(method: 'get' | 'post', url: string, body?: unknown) {
  try {
    const { data } = await http.request<unknown>({ method, url, data: body })
    return walletSessionSchema.parse(data).wallet
  } catch (error) {
    if (error instanceof z.ZodError) throw error
    throw ApiError.from(error)
  }
}

/*
 * Estado da carteira conectada. Numa aplicação real quem responde é a
 * extensão; o contrato é o mesmo de qualquer jeito — conectado com endereço,
 * ou nada. Não é otimista: quem decide é a pessoa dentro da carteira, e
 * mostrar "conectado" antes do aceite seria mentira.
 */
export const walletSessionQuery = queryOptions({
  queryKey: WALLET_SESSION_KEY,
  queryFn: () => request('get', '/wallet'),
  staleTime: 0,
})

export function useConnectWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (walletType: string) => request('post', '/wallet/connect', { walletType }),
    onSuccess: (wallet) => queryClient.setQueryData(WALLET_SESSION_KEY, wallet),
  })
}

export function useDisconnectWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => request('post', '/wallet/disconnect'),
    onSuccess: () => queryClient.setQueryData(WALLET_SESSION_KEY, null),
  })
}
