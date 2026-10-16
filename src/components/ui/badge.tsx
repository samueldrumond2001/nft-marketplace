import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * O `useRender` do registro é o que torna o Badge útil aqui: a mesma etiqueta
 * serve de `span` sobre a arte e de `li` na lista de filtros ativos, sem
 * duplicar o componente.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap [&>svg]:size-3',
  {
    variants: {
      variant: {
        // selo "RARO": canto reto, colado no topo da arte
        solid: 'bg-primary text-ink text-3xs px-3 py-1 font-bold tracking-[0.08em]',
        outline: 'border-border-soft text-text-secondary rounded-input border px-2 py-0.5 text-3xs',
        muted: 'bg-surface-dark text-text-secondary rounded-input px-2 py-0.5 text-3xs',
      },
    },
    defaultVariants: { variant: 'solid' },
  },
)

function Badge({
  className,
  variant,
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>({ className: cn(badgeVariants({ variant }), className) }, props),
    render,
    state: { slot: 'badge', variant },
  })
}

export { Badge, badgeVariants }
