import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { ApiError, http } from '@/lib/http'
import { STALE } from '@/lib/query-client'

export const FAVORITES_KEY = ['favorites'] as const

const favoritesSchema = z.object({ nftIds: z.array(z.string()) })

async function request(method: 'get' | 'put' | 'delete', url: string) {
  try {
    const { data } = await http.request<unknown>({ method, url })
    return favoritesSchema.parse(data).nftIds
  } catch (error) {
    if (error instanceof z.ZodError) throw error
    throw ApiError.from(error)
  }
}

/*
 * Favorito é do usuário, então a lista mora no servidor e não no navegador:
 * entrar em outro aparelho tem que mostrar os mesmos corações. A consulta só
 * roda com sessão — deslogado a API responde 401, e pedir isso a cada visita
 * anônima só encheria o console de erro.
 */
export const favoritesQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: FAVORITES_KEY,
    queryFn: () => request('get', '/favorites'),
    staleTime: STALE.session,
    enabled,
  })

/**
 * PUT e DELETE, não um POST de "alternar": o cliente diz o estado final que
 * quer, então clicar duas vezes depressa não acaba invertendo o resultado.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      request(favorite ? 'put' : 'delete', `/favorites/${nftId}`),

    // otimista com rollback, igual ao carrinho: o coração não pode esperar
    // a ida e volta para mudar de cor
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY })
      const previous = queryClient.getQueryData<string[]>(FAVORITES_KEY)
      if (previous) {
        queryClient.setQueryData(
          FAVORITES_KEY,
          favorite ? [...previous, nftId] : previous.filter((id) => id !== nftId),
        )
      }
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(FAVORITES_KEY, context.previous)
    },
    onSuccess: (nftIds) => queryClient.setQueryData(FAVORITES_KEY, nftIds),
    onSettled: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  })
}
