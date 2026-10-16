import { useQuery } from '@tanstack/react-query'

import { useAddToCart } from '@/features/cart'
import { useFavorites } from '@/features/favorites'
import { cn } from '@/lib/utils'
import { nftListQuery } from '../api/queries'
import type { CatalogFilterPatch, CatalogFilters } from '../model/nft'
import { CatalogToolbar } from './CatalogToolbar'
import { FeaturedCard } from './FeaturedCard'
import { FiltersSidebar } from './FiltersSidebar'
import { NftCard, NftCardSkeleton } from './NftCard'
import { Pagination } from './Pagination'

interface CatalogSectionProps {
  filters: CatalogFilters
  onChange: (patch: CatalogFilterPatch) => void
  /** o bloco de destaque só aparece na home, como no design */
  featured?: boolean
  /** a gaveta de filtros do mobile é aberta pela barra de busca, que fica
   *  acima do hero — por isso o estado mora na rota, não aqui */
  filtersOpen?: boolean
  onCloseFilters?: (() => void) | undefined
}

export function CatalogSection({
  filters,
  onChange,
  featured = false,
  filtersOpen = false,
  onCloseFilters,
}: CatalogSectionProps) {
  const addToCart = useAddToCart()
  const favorites = useFavorites()
  const { data, isPending, isFetching, isError, error } = useQuery(nftListQuery(filters))

  const bounds = {
    min: Number(data?.facets.priceMin ?? '0'),
    max: Number(data?.facets.priceMax ?? '12.30'),
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,268px)_1fr]">
      <div className="space-y-8 max-md:contents">
        <FiltersSidebar
          collections={data?.facets.collections ?? []}
          networks={data?.facets.networks ?? []}
          bounds={bounds}
          filters={filters}
          onChange={onChange}
          open={filtersOpen}
          onClose={onCloseFilters}
        />
        {featured && (
          <div className="max-md:hidden">
            <FeaturedCard />
          </div>
        )}
      </div>

      <section aria-labelledby="catalogo-titulo">
        {/* título de verdade em vez de aria-label: o design não desenha um,
            mas sem ele os cards (h3) viriam direto depois do h1 e a ordem dos
            cabeçalhos quebrava — no celular a sidebar, que tem os h2, nem
            está na página */}
        <h2 id="catalogo-titulo" className="sr-only">
          Catálogo de NFTs
        </h2>
        <CatalogToolbar filters={filters} onChange={onChange} />

        {isError ? (
          <p role="alert" className="text-text-secondary py-16 text-center text-sm">
            Não foi possível carregar o catálogo. {error.message}
          </p>
        ) : isPending ? (
          <ul className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <li key={index}>
                <NftCardSkeleton />
              </li>
            ))}
          </ul>
        ) : data.items.length === 0 ? (
          <p className="text-text-secondary py-16 text-center text-sm">
            Nenhum NFT corresponde a esses filtros.
          </p>
        ) : (
          /* keepPreviousData evita a grade piscar vazia, mas deixa dado
               velho na tela por um instante — daí o esmaecido e o aria-busy */
          <ul
            aria-label="Resultados"
            aria-busy={isFetching}
            className={cn(
              'mt-6 grid grid-cols-2 gap-5 transition-opacity lg:grid-cols-3',
              isFetching && 'pointer-events-none opacity-60',
            )}
          >
            {data.items.map((nft, index) => (
              <li key={nft.id}>
                <NftCard
                  nft={nft}
                  priority={index < 3}
                  onAddToCart={(item) =>
                    addToCart.mutate({ nftId: item.id, editionLabel: '1/50', quantity: 1 })
                  }
                  favorite={favorites.isFavorite(nft.id)}
                  onToggleFavorite={(item) => favorites.toggle(item.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {data && (
          <div className="mt-10">
            <Pagination
              page={data.page}
              total={data.total}
              limit={data.limit}
              onChange={(page) => onChange({ page })}
            />
          </div>
        )}
      </section>
    </div>
  )
}
