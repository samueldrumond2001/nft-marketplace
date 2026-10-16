import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import type { NftSummary } from '../model/nft'
import { NftCard } from './NftCard'
import { Button } from '@/components/ui/button'

interface RelatedCarouselProps {
  title: string
  items: NftSummary[]
}

const PER_PAGE = 5

// scroll-snap em vez de slider: trackpad e toque arrastam, e os cards fora
// de tela continuam no DOM e alcançáveis por tab.
export function RelatedCarousel({ title, items }: RelatedCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE))

  const goTo = (target: number) => {
    setPage(target)
    const track = trackRef.current
    if (track) track.scrollTo({ left: track.clientWidth * target, behavior: 'smooth' })
  }

  return (
    <section className="mt-16" aria-label={title}>
      <h2 className="text-text-accent border-border border-b pb-3 text-base font-bold">{title}</h2>

      <ul
        ref={trackRef}
        className={cn(
          'mt-6 grid snap-x snap-mandatory grid-flow-col gap-5 overflow-x-auto pb-2',
          // dois cards por tela no celular, três no tablet, cinco no desktop
          'auto-cols-[calc((100%-1.25rem)/2)] sm:auto-cols-[calc((100%-2.5rem)/3)] lg:auto-cols-[calc((100%-5rem)/5)]',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {items.map((nft) => (
          <li key={nft.id} className="snap-start">
            <NftCard nft={nft} />
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        <div className="mt-6 flex justify-center gap-2.5">
          {Array.from({ length: pageCount }, (_, index) => (
            <Button
              key={index}
              variant="ghost"
              onClick={() => goTo(index)}
              aria-label={`Ir para o grupo ${index + 1}`}
              aria-current={index === page}
              // o ponto é pequeno por design; o p-2 leva o alvo aos 24px da WCAG
              className="h-auto p-2"
            >
              <span
                aria-hidden
                className={cn(
                  'block size-2.5 rounded-full',
                  index === page ? 'bg-primary' : 'bg-border-soft',
                )}
              />
            </Button>
          ))}
        </div>
      )}
    </section>
  )
}
