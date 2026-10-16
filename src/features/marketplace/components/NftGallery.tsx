import { Search } from 'lucide-react'
import { useState } from 'react'

import { ArtImage } from '@/components/ui/ArtImage'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface NftGalleryProps {
  images: string[]
  alt: string
}

export function NftGallery({ images, alt }: NftGalleryProps) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const current = images[active] ?? images[0] ?? ''

  return (
    <div className="flex gap-4">
      <ul className="flex shrink-0 flex-col gap-4">
        {images.map((image, index) => (
          <li key={`${image}-${index}`}>
            <Button
              variant="ghost"
              onClick={() => setActive(index)}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-current={index === active}
              className={cn(
                'rounded-input block size-[88px] overflow-hidden border p-0',
                index === active ? 'border-primary' : 'border-border hover:border-border-soft',
              )}
            >
              <ArtImage
                art={image}
                alt=""
                width={88}
                height={88}
                sizes="88px"
                className="size-full object-cover"
              />
            </Button>
          </li>
        ))}
      </ul>

      <div className="bg-surface-card rounded-card relative min-w-0 flex-1 self-start overflow-hidden">
        <ArtImage
          art={current}
          alt={alt}
          width={390}
          height={390}
          sizes="(min-width: 1024px) 390px, 90vw"
          priority
          className="aspect-square w-full object-cover"
        />
        <Button
          variant="overlay"
          size="icon"
          onClick={() => setZoomed(true)}
          aria-label="Ampliar imagem"
          className="absolute top-4 right-4"
        >
          <Search className="size-4" strokeWidth={1.75} />
        </Button>
      </div>

      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent
          aria-label={`${alt} ampliado`}
          closeLabel="Fechar"
          className="bg-ink/95 inset-0 flex max-h-none w-full max-w-none translate-x-0 translate-y-0 items-center justify-center rounded-none p-8 ring-0"
        >
          <DialogTitle className="sr-only">{alt} ampliado</DialogTitle>
          <img
            src={`/nft/${current}-960.webp`}
            alt={alt}
            className="rounded-card max-h-full max-w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
