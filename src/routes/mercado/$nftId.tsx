import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Heart, Link2, Mail, Star, Twitter } from 'lucide-react'
import { useState } from 'react'

import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Container } from '@/components/layout/Container'
import { useAddToCart } from '@/features/cart'
import { useFavorites } from '@/features/favorites'
import { useNftSubscription } from '@/features/realtime'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import {
  EditionPicker,
  NftGallery,
  NftTabs,
  RelatedCarousel,
  nftDetailQuery,
  relatedNftsQuery,
} from '@/features/marketplace'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/mercado/$nftId')({
  // busca antes de montar: vindo do card não pisca esqueleto
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(nftDetailQuery(params.nftId)),
  component: NftDetailPage,
  // id que não existe é 404 do recurso, não erro do app: endereço antigo,
  // link colado errado ou NFT retirado. A tela diz isso e oferece a saída.
  errorComponent: NftNotFound,
})

function NftNotFound() {
  const { nftId } = Route.useParams()

  return (
    <Container className="py-24 text-center">
      <h1 className="text-foreground text-heading">NFT não encontrado</h1>
      <p className="text-text-secondary mx-auto mt-4 max-w-[460px] text-xs">
        Não existe nenhum NFT com o identificador <code className="text-text-accent">{nftId}</code>.
        Ele pode ter sido retirado da venda.
      </p>
      <Button render={<Link to="/mercado" />} className="mt-10">
        VER O CATÁLOGO
      </Button>
    </Container>
  )
}

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { data: nft } = useQuery(nftDetailQuery(nftId))
  const { data: related } = useQuery(relatedNftsQuery(nftId))
  useNftSubscription(nftId)

  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const favorites = useFavorites()
  const [edition, setEdition] = useState('1-50')
  const [quantity, setQuantity] = useState(1)

  if (!nft) return null

  const isFavorite = favorites.isFavorite(nft.id)
  const selected = nft.editions.find((item) => item.id === edition)
  // `remaining: null` é edição aberta, sem teto. Com teto, o limite do
  // contador é o que resta: pedir 9 de uma edição com 2 só falharia no POST.
  const maxQuantity = selected?.remaining ?? 99
  const unavailable = nft.soldOut || maxQuantity === 0

  return (
    <Container className="pt-6 pb-20">
      <Breadcrumb
        items={[
          { label: 'Início', to: '/' },
          { label: 'Mercado', to: '/mercado' },
          { label: nft.name },
        ]}
      />

      <div className="mt-5 grid gap-12 lg:grid-cols-[minmax(0,500px)_1fr]">
        <NftGallery images={nft.gallery} alt={nft.name} />

        <section aria-label="Compra">
          <h1 className="text-foreground text-heading">{nft.name}</h1>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-text-accent tabular text-lg font-bold">{nft.price} ETH</p>
            <p className="flex items-center gap-2">
              <span className="flex" aria-hidden>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      'size-3.5',
                      index < Math.round(nft.ratingAverage)
                        ? 'fill-primary text-primary'
                        : 'text-border-soft',
                    )}
                  />
                ))}
              </span>
              <span className="text-foreground text-xs">
                {nft.ratingCount} avaliações de colecionadores
                <span className="sr-only">, média {nft.ratingAverage.toFixed(1)} de 5</span>
              </span>
            </p>
          </div>

          <h2 className="text-foreground mt-6 text-xs font-bold">Sobre este NFT:</h2>
          <p className="text-text-secondary mt-2 max-w-[530px] text-xs">{nft.description}</p>

          <h2 className="text-foreground mt-5 text-xs font-bold">Edição:</h2>
          <div className="mt-2">
            <EditionPicker editions={nft.editions} value={edition} onChange={setEdition} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div>
              <QuantityStepper
                value={Math.min(quantity, Math.max(1, maxQuantity))}
                onChange={setQuantity}
                max={Math.max(1, maxQuantity)}
                label={`Quantidade de ${nft.name}`}
              />
              {selected?.remaining !== null && selected?.remaining !== undefined && (
                <p className="text-text-secondary text-micro mt-1" role="status">
                  {selected.remaining === 0
                    ? 'Edição esgotada'
                    : selected.remaining === 1
                      ? 'Última unidade desta edição'
                      : `${selected.remaining} unidades nesta edição`}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                disabled={unavailable || addToCart.isPending}
                onClick={() => {
                  const label = nft.editions.find((item) => item.id === edition)?.label ?? '1/50'
                  addToCart.mutate(
                    { nftId: nft.id, editionLabel: label, quantity },
                    { onSuccess: () => void navigate({ to: '/carrinho' }) },
                  )
                }}
                className="px-10 text-xs tracking-[0.06em]"
              >
                {unavailable ? 'ESGOTADO' : 'COMPRAR'}
              </Button>
              <Button
                variant="outline"
                aria-pressed={isFavorite}
                onClick={() => favorites.toggle(nft.id)}
                className={cn(
                  'gap-2 px-5 py-2.5 text-xs font-normal',
                  isFavorite && 'bg-primary text-ink',
                )}
              >
                <Heart
                  className="size-4"
                  strokeWidth={1.75}
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
                {isFavorite ? 'Favoritado' : 'Favoritar'}
              </Button>
            </div>
          </div>

          <dl className="mt-6 space-y-1.5 text-xs">
            <Meta label="ID do token">{nft.tokenId}</Meta>
            <Meta label="Coleção">Kurio Apes</Meta>
            <Meta label="Atributos">{nft.attributes.join(', ')}</Meta>
          </dl>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-foreground text-xs font-bold">Compartilhar este NFT:</span>
            <ShareLink label="Compartilhar no LinkedIn" icon={Link2} />
            <ShareLink label="Compartilhar por e-mail" icon={Mail} />
            <ShareLink label="Compartilhar no Twitter" icon={Twitter} />
          </div>
        </section>
      </div>

      <NftTabs nft={nft} />

      {related && related.length > 0 && (
        <RelatedCarousel title="Mais desta coleção" items={related} />
      )}
    </Container>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-text-secondary">{label}:</dt>
      <dd className="text-text-secondary">{children}</dd>
    </div>
  )
}

function ShareLink({ label, icon: Icon }: { label: string; icon: typeof Mail }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="text-foreground hover:text-text-accent transition-colors"
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </a>
  )
}
