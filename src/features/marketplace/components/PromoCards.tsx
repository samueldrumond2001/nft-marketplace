import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { ArtImage } from '@/components/ui/ArtImage'

const CARDS = [
  {
    art: 'emerald-ape',
    title: ['Lançamentos gênesis', 'de edição limitada'],
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
  },
  {
    art: 'ivory-baron',
    title: ['Arte digital selecionada', 'e muito mais'],
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
  },
] as const

/** Os dois blocos logo abaixo da listagem, com o texto alinhado à direita. */
export function PromoCards() {
  return (
    <section aria-label="Destaques" className="mt-10 grid gap-6 md:grid-cols-2">
      {CARDS.map((card) => (
        <article
          key={card.art}
          className="bg-surface-card rounded-card grid grid-cols-[minmax(0,155px)_1fr] items-center overflow-hidden"
        >
          <ArtImage
            art={card.art}
            alt=""
            width={155}
            height={155}
            sizes="155px"
            className="aspect-square size-full object-cover"
          />

          <div className="px-6 py-5 text-right">
            <h3 className="text-foreground text-base leading-snug font-bold">
              {card.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h3>
            <p className="text-text-secondary text-3xs mt-3">{card.text}</p>
            <Link
              to="/mercado"
              className="bg-primary text-ink rounded-btn text-3xs mt-4 inline-flex items-center gap-2 px-4 py-1.5 font-medium"
            >
              Explorar
              <ArrowRight className="size-3" strokeWidth={2} />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}
