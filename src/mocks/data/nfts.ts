import type { Facet, Network, NftDetail, NftSummary } from '@/features/marketplace'

// Os 9 primeiros são os do Figma (nome, preço, arte), pra dar pra comparar a
// tela com o design. O resto é gerado só pra paginação ter 4 páginas.
// O Figma reusa 4 artes entre os 9 nomes; aqui também.

// nome da arte; as larguras WebP são montadas em ArtImage
const ART = {
  emerald: 'emerald-ape',
  sage: 'sage-nomad',
  ivory: 'ivory-baron',
  golden: 'golden-beat',
} as const

interface Seed {
  name: string
  price: string
  previousPrice?: string
  image: string
  collection: string
  network: Network
  rare?: boolean
}

const SEEDS: Seed[] = [
  {
    name: 'Emerald Ape #042',
    price: '1.19',
    image: ART.emerald,
    collection: 'arte-digital',
    network: 'ethereum',
  },
  {
    name: 'Sage Nomad #009',
    price: '1.69',
    image: ART.sage,
    collection: 'arte-digital',
    network: 'ethereum',
  },
  {
    name: 'Neon Vessel #552',
    price: '1.99',
    previousPrice: '2.29',
    image: ART.ivory,
    collection: 'colecionaveis',
    network: 'polygon',
    rare: true,
  },
  {
    name: 'Cosmic Bloom #118',
    price: '1.29',
    image: ART.sage,
    collection: 'generativa',
    network: 'ethereum',
  },
  {
    name: 'Violet Nomad #314',
    price: '1.39',
    image: ART.sage,
    collection: 'arte-digital',
    network: 'solana',
  },
  {
    name: 'Ivory Baron #088',
    price: '1.79',
    image: ART.ivory,
    collection: 'colecionaveis',
    network: 'ethereum',
  },
  {
    name: 'Golden Beat #207',
    price: '0.99',
    image: ART.golden,
    collection: 'musica',
    network: 'polygon',
  },
  {
    name: 'Golden Signal #160',
    price: '0.39',
    image: ART.golden,
    collection: 'musica',
    network: 'solana',
  },
  {
    name: 'Golden Frequency #071',
    price: '0.59',
    image: ART.golden,
    collection: 'musica',
    network: 'ethereum',
  },
]

const EXTRA_COLLECTIONS = ['fotografia', 'arte-3d', 'jogos', 'assinaturas', 'utilidade'] as const
const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']

function tokenIdOf(name: string): string {
  const match = /#(\d+)/.exec(name)
  return `#${(match?.[1] ?? '0').padStart(4, '0')}`
}

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/#/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toSummary(seed: Seed): NftSummary {
  return {
    id: slugOf(seed.name),
    name: seed.name,
    tokenId: tokenIdOf(seed.name),
    image: seed.image,
    price: seed.price,
    previousPrice: seed.previousPrice ?? null,
    collection: seed.collection,
    network: seed.network,
    rare: seed.rare ?? false,
    soldOut: false,
  }
}

/** Completa até 36 itens: 4 páginas de 9. */
function generateFiller(): NftSummary[] {
  const arts = Object.values(ART)
  const names = ['Amber Drift', 'Jade Circuit', 'Dusk Relic', 'Opal Signal', 'Umber Echo']

  return Array.from({ length: 27 }, (_, index) => {
    const base = names[index % names.length] ?? 'Amber Drift'
    const number = String(100 + index * 7).padStart(3, '0')
    const name = `${base} #${number}`
    // determinístico, 0.02 a 12.30, pro filtro de faixa ter o que fazer
    const price = (0.02 + ((index * 431) % 1228) / 100).toFixed(2)

    return {
      id: slugOf(name),
      name,
      tokenId: tokenIdOf(name),
      image: arts[index % arts.length] ?? ART.emerald,
      price,
      previousPrice: index % 9 === 0 ? (Number(price) + 0.4).toFixed(2) : null,
      collection: EXTRA_COLLECTIONS[index % EXTRA_COLLECTIONS.length] ?? 'fotografia',
      network: NETWORKS[index % NETWORKS.length] ?? 'ethereum',
      rare: index % 11 === 0,
      soldOut: index === 13,
    }
  })
}

export const NFTS: NftSummary[] = [...SEEDS.map(toSummary), ...generateFiller()]

/** Contagens do Figma. Não batem com o mock de propósito: no design são do
 *  acervo inteiro. */
export const COLLECTION_FACETS: Facet[] = [
  { value: 'arte-digital', label: 'Arte digital', count: 33 },
  { value: 'fotografia', label: 'Fotografia', count: 12 },
  { value: 'musica', label: 'Música', count: 65 },
  { value: 'arte-3d', label: 'Arte 3D', count: 39 },
  { value: 'colecionaveis', label: 'Colecionáveis', count: 23 },
  { value: 'generativa', label: 'Generativa', count: 17 },
  { value: 'jogos', label: 'Jogos', count: 19 },
  { value: 'assinaturas', label: 'Assinaturas', count: 13 },
  { value: 'utilidade', label: 'Utilidade', count: 18 },
]

export const NETWORK_FACETS: Facet[] = [
  { value: 'ethereum', label: 'Ethereum', count: 119 },
  { value: 'polygon', label: 'Polygon', count: 78 },
  { value: 'solana', label: 'Solana', count: 86 },
]

export const PRICE_BOUNDS = { min: '0.02', max: '12.30' } as const

const DESCRIPTION =
  'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.'

export function detailOf(summary: NftSummary): NftDetail {
  return {
    ...summary,
    gallery: [summary.image, summary.image, summary.image, summary.image],
    description: DESCRIPTION,
    editions: [
      { id: '1-1', label: '1/1', remaining: 1 },
      { id: '1-10', label: '1/10', remaining: 4 },
      { id: '1-50', label: '1/50', remaining: 22 },
      { id: 'open', label: 'ABERTA', remaining: null },
    ],
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
    contractAddress: '0x7A42...19E8',
    royaltyPercent: 5,
    ratingAverage: 4.6,
    ratingCount: 19,
  }
}
