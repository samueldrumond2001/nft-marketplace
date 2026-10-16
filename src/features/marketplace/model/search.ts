import { z } from 'zod'

import type { CatalogFilters } from './nft'

// Filtros na URL: "voltar" volta pra listagem certa e o link é compartilhável.
// Tudo opcional, senão <Link to="/"> teria que carregar a busca inteira.
export const catalogSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  tab: z.enum(['all', 'new', 'trending']).optional().catch(undefined),
  sort: z.enum(['recent', 'price-asc', 'price-desc', 'name']).optional().catch(undefined),
  collection: z.string().optional().catch(undefined),
  network: z.enum(['ethereum', 'polygon', 'solana']).optional().catch(undefined),
  priceMin: z.string().optional().catch(undefined),
  priceMax: z.string().optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

/** Aplica os padrões na leitura, já que o schema deixa tudo opcional. */
export function toCatalogFilters(search: CatalogSearch): CatalogFilters {
  return {
    page: search.page ?? 1,
    tab: search.tab ?? 'all',
    sort: search.sort ?? 'recent',
    q: search.q,
    collection: search.collection,
    network: search.network,
    priceMin: search.priceMin,
    priceMax: search.priceMax,
  }
}
