import { Link } from '@tanstack/react-router'
import { Heart, Search, ShoppingCart } from 'lucide-react'

import { ArtImage } from '@/components/ui/ArtImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { NftSummary } from '../model/nft'

interface NftCardProps {
  nft: NftSummary
  priority?: boolean
  // quem conecta ao carrinho é a rota; a feature não conhece a outra feature
  onAddToCart?: (nft: NftSummary) => void
  favorite?: boolean
  onToggleFavorite?: (nft: NftSummary) => void
}

export function NftCard({
  nft,
  priority = false,
  onAddToCart,
  favorite = false,
  onToggleFavorite,
}: NftCardProps) {
  return (
    <article className="group bg-surface-card rounded-card relative overflow-hidden">
      <div className="relative">
        {/* sem link na imagem: o do título já estica sobre o card. Dois links
            iguais seriam lidos duas vezes, e o esticado cobria o da imagem */}
        <ArtImage
          art={nft.image}
          alt=""
          width={400}
          height={400}
          // na grade cada card ocupa metade da tela no celular e um terço no desktop
          sizes="(min-width: 1024px) 260px, 45vw"
          priority={priority}
          className="rounded-t-card aspect-square w-full object-cover"
        />

        {nft.rare && <Badge className="absolute top-0 left-0">RARO</Badge>}

        {nft.soldOut && (
          <span className="bg-ink/80 text-foreground absolute inset-0 flex items-center justify-center text-sm font-bold">
            Esgotado
          </span>
        )}

        {/* focus-within mantém as ações alcançáveis por teclado, e em tela de
            toque elas ficam sempre visíveis: lá não existe hover, e sem isso
            não havia como adicionar ao carrinho pelo card */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-3 flex justify-center gap-2.5',
            'opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100',
            '[@media(hover:none)]:opacity-100',
          )}
        >
          <CardAction
            label={`Adicionar ${nft.name} ao carrinho`}
            icon={ShoppingCart}
            disabled={nft.soldOut}
            onClick={() => onAddToCart?.(nft)}
          />
          <CardAction
            label={favorite ? `Desfavoritar ${nft.name}` : `Favoritar ${nft.name}`}
            icon={Heart}
            pressed={favorite}
            onClick={() => onToggleFavorite?.(nft)}
          />
          <CardAction label={`Ver ${nft.name} ampliado`} icon={Search} />
        </div>
      </div>

      <div className="px-3 py-3">
        <h3 className="text-foreground truncate text-sm">
          <Link
            to="/mercado/$nftId"
            params={{ nftId: nft.id }}
            // estica o clique sobre o card inteiro
            className="after:absolute after:inset-0 after:content-['']"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="text-text-accent tabular text-sm font-bold">{nft.price} ETH</span>
          {nft.previousPrice && (
            <span className="text-text-secondary/70 tabular text-sm">
              <span className="sr-only">preço anterior </span>
              {nft.previousPrice} ETH
            </span>
          )}
        </p>
      </div>
    </article>
  )
}

function CardAction({
  label,
  icon: Icon,
  onClick,
  disabled,
  pressed,
}: {
  label: string
  icon: typeof ShoppingCart
  onClick?: () => void
  disabled?: boolean
  pressed?: boolean
}) {
  return (
    <Button
      variant="overlay"
      size="icon"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      // acima do ::after do título
      className={cn('relative z-10', pressed && 'bg-primary text-ink')}
    >
      <Icon className="size-4" strokeWidth={1.75} fill={pressed ? 'currentColor' : 'none'} />
    </Button>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-card overflow-hidden" aria-hidden>
      <Skeleton className="rounded-t-card aspect-square w-full rounded-b-none" />
      <div className="space-y-2 px-3 py-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
