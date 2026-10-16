import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/button'
import { meQuery } from '@/features/auth'
import { useAddToCart } from '@/features/cart'
import { favoritesQuery, useFavorites } from '@/features/favorites'
import { NftCard, NftCardSkeleton, nftsByIdQuery } from '@/features/marketplace'

export const Route = createFileRoute('/favoritos')({
  // rota privada: favorito é de alguém. O login abre já de volta para cá.
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQuery)
    if (!user) {
      // o router sinaliza redirecionamento por throw; redirect() não é um Error
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: '/', search: { auth: 'login' }, replace: true })
    }
  },
  component: FavoritesPage,
})

function FavoritesPage() {
  const addToCart = useAddToCart()
  const favorites = useFavorites()
  const { data: ids, isPending: loadingIds } = useQuery(favoritesQuery(true))
  const { data, isPending: loadingNfts } = useQuery(nftsByIdQuery(ids ?? []))

  const loading = loadingIds || (ids !== undefined && ids.length > 0 && loadingNfts)

  return (
    <Container className="py-10 pb-20">
      <h1 className="text-foreground text-heading">Favoritos</h1>
      <p className="text-text-secondary mt-2 text-xs">
        O que você marcou com o coração. A lista é da sua conta e acompanha você em qualquer
        aparelho.
      </p>

      {loading ? (
        <ul className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : !ids || ids.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-text-secondary text-sm">Você ainda não favoritou nenhum NFT.</p>
          <Button render={<Link to="/mercado" />} className="mt-6">
            EXPLORAR O MERCADO
          </Button>
        </div>
      ) : (
        <ul aria-label="NFTs favoritados" className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {(data?.items ?? []).map((nft) => (
            <li key={nft.id}>
              <NftCard
                nft={nft}
                favorite
                onToggleFavorite={(item) => favorites.toggle(item.id)}
                onAddToCart={(item) =>
                  addToCart.mutate({ nftId: item.id, editionLabel: '1/50', quantity: 1 })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
