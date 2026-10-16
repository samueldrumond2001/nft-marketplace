import { z } from 'zod'

// Preço é string decimal, não number: 18 casas não cabem em float.
// Vira wei em lib/eth assim que entra.
export const ethAmountSchema = z.string().regex(/^\d+(\.\d{1,18})?$/, 'valor ETH inválido')

export const networkSchema = z.enum(['ethereum', 'polygon', 'solana'])
export type Network = z.infer<typeof networkSchema>

export const NETWORK_LABEL: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: z.string(),
  price: ethAmountSchema,
  /** preço anterior, quando o item está com desconto */
  previousPrice: ethAmountSchema.nullable(),
  collection: z.string(),
  network: networkSchema,
  rare: z.boolean(),
  soldOut: z.boolean(),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const editionSchema = z.object({
  id: z.string(),
  label: z.string(),
  remaining: z.number().int().nonnegative().nullable(),
})
export type Edition = z.infer<typeof editionSchema>

export const nftDetailSchema = nftSummarySchema.extend({
  gallery: z.array(z.string()).min(1),
  description: z.string(),
  editions: z.array(editionSchema),
  attributes: z.array(z.string()),
  contractAddress: z.string(),
  royaltyPercent: z.number(),
  ratingAverage: z.number(),
  ratingCount: z.number().int(),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

export const facetSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int(),
})
export type Facet = z.infer<typeof facetSchema>

export const nftListSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  facets: z.object({
    collections: z.array(facetSchema),
    networks: z.array(facetSchema),
    priceMin: ethAmountSchema,
    priceMax: ethAmountSchema,
  }),
})
export type NftList = z.infer<typeof nftListSchema>

export const CATALOG_TABS = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
] as const
export type CatalogTab = (typeof CATALOG_TABS)[number]['value']

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'name', label: 'Nome' },
] as const
export type SortOption = (typeof SORT_OPTIONS)[number]['value']

// `| undefined` explícito: com exactOptionalPropertyTypes, `collection?: string`
// recusa `{ collection: undefined }`, que é como a sidebar limpa um filtro.
export interface CatalogFilters {
  page: number
  tab: CatalogTab
  sort: SortOption
  /** busca por nome, vinda da barra do mobile */
  q?: string | undefined
  collection?: string | undefined
  network?: Network | undefined
  priceMin?: string | undefined
  priceMax?: string | undefined
}

export type CatalogFilterPatch = Partial<CatalogFilters>
