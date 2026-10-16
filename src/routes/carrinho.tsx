import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Container } from '@/components/layout/Container'
import { CartSummary, CartTable, cartQuery } from '@/features/cart'
import { RelatedCarousel, nftListQuery } from '@/features/marketplace'

export const Route = createFileRoute('/carrinho')({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery),
  component: CartPage,
})

function CartPage() {
  const { data: cart } = useQuery(cartQuery)
  const { data: suggestions } = useQuery(nftListQuery({ page: 1, tab: 'trending', sort: 'recent' }))

  if (!cart) return null

  return (
    <Container className="pt-6 pb-20">
      <Breadcrumb
        items={[
          { label: 'Início', to: '/' },
          { label: 'Mercado', to: '/mercado' },
          { label: 'Carrinho' },
        ]}
      />

      {cart.items.length === 0 ? (
        <div className="py-24 text-center">
          <h1 className="text-foreground text-heading">Seu carrinho está vazio</h1>
          <p className="text-text-secondary mt-3 text-sm">
            Explore o mercado e adicione NFTs à sua coleção.
          </p>
          <Link
            to="/"
            className="bg-primary text-ink rounded-btn mt-8 inline-block px-6 py-2.5 text-xs font-bold tracking-[0.06em]"
          >
            EXPLORAR
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid gap-20 lg:grid-cols-[1fr_minmax(0,334px)]">
          <CartTable cart={cart} />
          <CartSummary cart={cart} />
        </div>
      )}

      {suggestions && suggestions.items.length > 0 && (
        <RelatedCarousel title="Colecionadores também viram" items={suggestions.items} />
      )}
    </Container>
  )
}
