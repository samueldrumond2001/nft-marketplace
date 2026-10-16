import type { NftSummary, SortOption } from '@/features/marketplace'
import { COLLECTION_FACETS, detailOf, NETWORK_FACETS, NFTS, PRICE_BOUNDS } from '../data/nfts'
import type { Scenario } from '../scenarios'

// Regra do mock separada do transporte: MSW e o middleware do Vite chamam
// isto, então não divergem. E dá pra testar sem browser.

export const PAGE_SIZE = 9

export interface MockResult {
  status: number
  body: Record<string, unknown> | unknown[]
}

const FACETS = {
  collections: COLLECTION_FACETS,
  networks: NETWORK_FACETS,
  priceMin: PRICE_BOUNDS.min,
  priceMax: PRICE_BOUNDS.max,
}

function sortItems(items: NftSummary[], sort: SortOption): NftSummary[] {
  const copy = [...items]
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => Number(a.price) - Number(b.price))
    case 'price-desc':
      return copy.sort((a, b) => Number(b.price) - Number(a.price))
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    default:
      return copy
  }
}

export function listNfts(params: URLSearchParams, scenario: Scenario): MockResult {
  if (scenario === 'empty') {
    return { status: 200, body: { items: [], page: 1, limit: PAGE_SIZE, total: 0, facets: FACETS } }
  }

  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const tab = params.get('tab') ?? 'all'
  const sort = (params.get('sort') ?? 'recent') as SortOption
  const q = params.get('q')?.trim().toLowerCase()
  const collection = params.get('collection')
  const network = params.get('network')
  const priceMin = params.get('priceMin')
  const priceMax = params.get('priceMax')

  // `ids` serve a tela de favoritos: a lista de ids vem de /favorites e os
  // dados do NFT continuam vindo de um lugar só.
  const ids = params.get('ids')?.split(',').filter(Boolean)

  let items = NFTS
  if (ids) items = items.filter((nft) => ids.includes(nft.id))
  if (q) items = items.filter((nft) => nft.name.toLowerCase().includes(q))
  if (collection) items = items.filter((nft) => nft.collection === collection)
  if (network) items = items.filter((nft) => nft.network === network)
  if (priceMin) items = items.filter((nft) => Number(nft.price) >= Number(priceMin))
  if (priceMax) items = items.filter((nft) => Number(nft.price) <= Number(priceMax))

  // backend real teria campos próprios pra isso
  if (tab === 'new') items = items.filter((_, index) => index % 2 === 0)
  if (tab === 'trending') items = items.filter((nft) => nft.rare || Number(nft.price) > 1.2)

  items = sortItems(items, sort)

  const total = items.length
  const start = (page - 1) * PAGE_SIZE

  return {
    status: 200,
    body: {
      items: items.slice(start, start + PAGE_SIZE),
      page,
      limit: PAGE_SIZE,
      total,
      facets: FACETS,
    },
  }
}

export function getNft(id: string): MockResult {
  const nft = NFTS.find((item) => item.id === id)
  if (!nft) {
    return {
      status: 404,
      body: { error: { code: 'NFT_NOT_FOUND', message: 'NFT não encontrado.' } },
    }
  }
  return { status: 200, body: detailOf(nft) }
}

export function getRelatedNfts(id: string): MockResult {
  // 15 = três grupos de cinco (os pontos do design)
  return { status: 200, body: NFTS.filter((item) => item.id !== id).slice(0, 15) }
}

/** Marca o NFT como esgotado na fonte, para o refetch depois do evento de
 *  socket devolver a mesma coisa que o evento anunciou. */
export function markSoldOut(id: string): void {
  const nft = NFTS.find((item) => item.id === id)
  if (nft) nft.soldOut = true
}
