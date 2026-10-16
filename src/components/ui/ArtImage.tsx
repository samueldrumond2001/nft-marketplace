interface ArtImageProps {
  /** nome da arte, sem extensão: "emerald-ape" */
  art: string
  alt: string
  /** largura renderizada, para o browser escolher a variante certa */
  sizes: string
  width: number
  height: number
  priority?: boolean
  className?: string
}

const WIDTHS = [240, 480, 960]

/**
 * As artes são servidas em WebP em três larguras, geradas por
 * `scripts/optimize-art.mjs`. Os PNGs originais ficam em design/assets e nunca
 * chegam ao bundle.
 */
export function ArtImage({
  art,
  alt,
  sizes,
  width,
  height,
  priority = false,
  className,
}: ArtImageProps) {
  const srcSet = WIDTHS.map((size) => `/nft/${art}-${size}.webp ${size}w`).join(', ')

  return (
    <img
      src={`/nft/${art}-480.webp`}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
    />
  )
}
