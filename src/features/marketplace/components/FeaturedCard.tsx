import { Link } from '@tanstack/react-router'

import { ArtImage } from '@/components/ui/ArtImage'

// Fixo no design; vira dado quando houver endpoint de curadoria.
export function FeaturedCard() {
  return (
    <section className="bg-surface-card rounded-card overflow-hidden" aria-label="NFT em destaque">
      <div className="px-5 pt-5 pb-4">
        <h2 className="text-text-accent text-base font-bold">NFT EM DESTAQUE</h2>
        <p className="text-foreground mt-1 text-sm font-bold">OFERTA LIMITADA</p>
      </div>
      <Link to="/mercado/$nftId" params={{ nftId: 'cosmic-bloom-118' }} className="block">
        <ArtImage
          art="sage-nomad"
          alt="Cosmic Bloom #118"
          width={268}
          height={310}
          sizes="268px"
          className="aspect-[268/310] w-full object-cover"
        />
      </Link>
    </section>
  )
}
