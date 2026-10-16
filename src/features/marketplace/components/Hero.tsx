import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { ArtImage } from '@/components/ui/ArtImage'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const SLIDES = [
  {
    eyebrow: 'Bem-vindo à Kurio',
    title: ['SEJA DONO DO FUTURO', 'DA ARTE DIGITAL'],
    text: 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    image: 'emerald-ape',
  },
  {
    eyebrow: 'Bem-vindo à Kurio',
    title: ['COLEÇÕES QUE', 'DEFINEM A REDE'],
    text: 'Edições escassas, procedência verificada e lançamentos acompanhados de perto por quem coleciona a sério.',
    image: 'sage-nomad',
  },
  {
    eyebrow: 'Bem-vindo à Kurio',
    title: ['ARTE DIGITAL', 'SELECIONADA'],
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura da internet.',
    image: 'ivory-baron',
  },
] as const

export function Hero() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index] ?? SLIDES[0]

  return (
    <section
      className={cn(
        // mobile: card compacto com a arte ao lado, como no design
        'bg-surface-card rounded-card grid grid-cols-[1fr_auto] items-center gap-4 p-5',
        // desktop: duas colunas largas, sem o card
        'md:grid-cols-[1fr_minmax(0,452px)] md:gap-12 md:bg-transparent md:p-0 md:py-10',
      )}
    >
      <div>
        <p className="text-text-secondary text-micro md:text-xs">{slide.eyebrow}</p>

        <h1 className="text-foreground md:text-display mt-2 text-lg leading-tight font-bold md:mt-5">
          {slide.title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        <p className="text-text-secondary text-micro mt-3 max-w-[440px] md:mt-5 md:text-xs">
          {slide.text}
        </p>

        <Link
          to="/mercado"
          className={cn(
            'text-text-accent text-micro mt-4 inline-flex items-center gap-2 font-bold tracking-[0.06em]',
            'md:bg-primary md:text-ink md:rounded-btn md:mt-8 md:px-6 md:py-2.5 md:text-xs',
          )}
        >
          EXPLORAR
          <ArrowRight className="size-3.5 md:hidden" strokeWidth={2} />
        </Link>

        <div className="mt-3 -ml-2 flex items-center md:mt-8">
          {SLIDES.map((item, slideIndex) => (
            <Button
              key={item.title.join(' ')}
              variant="ghost"
              onClick={() => setIndex(slideIndex)}
              aria-label={`Ir para o destaque ${slideIndex + 1}`}
              aria-current={slideIndex === index}
              // o ponto é pequeno por design; o p-2 leva o alvo aos 24px da WCAG
              className="h-auto p-2"
            >
              <span
                aria-hidden
                className={cn(
                  'block size-2 rounded-full transition-colors md:size-2.5',
                  slideIndex === index ? 'bg-primary' : 'bg-border-soft',
                )}
              />
            </Button>
          ))}
        </div>
      </div>

      <div className="border-border-soft rounded-card w-[120px] overflow-hidden border md:w-auto">
        <ArtImage
          art={slide.image}
          alt=""
          width={452}
          height={452}
          sizes="(min-width: 768px) 452px, 120px"
          // é o LCP da página
          priority
          className="aspect-square w-full object-cover"
        />
      </div>
    </section>
  )
}
