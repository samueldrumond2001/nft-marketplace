import { queryOptions } from '@tanstack/react-query'

import { ApiError, http } from '@/lib/http'
import { STALE } from '@/lib/query-client'
import type { CatalogFilters } from '../model/nft'
import { nftDetailSchema, nftListSchema, nftSummarySchema } from '../model/nft'
import { z } from 'zod'

function toParams(filters: CatalogFilters): Record<string, string> {
  const params: Record<string, string> = {
    page: String(filters.page),
    tab: filters.tab,
    sort: filters.sort,
  }
  if (filters.q) params.q = filters.q
  if (filters.collection) params.collection = filters.collection
  if (filters.network) params.network = filters.network
  if (filters.priceMin) params.priceMin = filters.priceMin
  if (filters.priceMax) params.priceMax = filters.priceMax
  return params
}

// Valida antes de virar cache: erro onde o contrato quebrou, não um
// undefined silencioso três componentes depois.
//
// O `signal` vem do próprio Query: ao trocar de filtro ele aborta a requisição
// anterior, então resposta que chega fora de ordem é descartada no transporte,
// antes de virar estado. O cache por chave já impediria a sobrescrita, mas
// abortar também economiza a resposta que ninguém vai ler.
async function get<T>(
  url: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  params?: Record<string, string>,
) {
  try {
    const { data } = await http.get<unknown>(url, { signal, ...(params ? { params } : {}) })
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) throw error
    throw ApiError.from(error)
  }
}

export const nftListQuery = (filters: CatalogFilters) =>
  queryOptions({
    queryKey: ['nfts', filters] as const,
    queryFn: ({ signal }) => get('/nfts', nftListSchema, signal, toParams(filters)),
    staleTime: STALE.catalog,
    // sem isso a grade pisca vazia a cada troca de página
    placeholderData: (previous) => previous,
  })

/** Usada pela tela de favoritos: os ids vêm de /favorites, os dados daqui. */
export const nftsByIdQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ['nfts', 'by-id', ids] as const,
    queryFn: ({ signal }) =>
      get('/nfts', nftListSchema, signal, {
        ids: ids.join(','),
        page: '1',
        tab: 'all',
        sort: 'recent',
      }),
    staleTime: STALE.catalog,
    enabled: ids.length > 0,
  })

export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: ['nft', id] as const,
    queryFn: ({ signal }) => get(`/nfts/${id}`, nftDetailSchema, signal),
    staleTime: STALE.nftDetail,
  })

export const relatedNftsQuery = (id: string) =>
  queryOptions({
    queryKey: ['nft', id, 'related'] as const,
    queryFn: ({ signal }) => get(`/nfts/${id}/related`, z.array(nftSummarySchema), signal),
    staleTime: STALE.catalog,
  })
