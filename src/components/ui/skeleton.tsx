import type * as React from 'react'

import { cn } from '@/lib/utils'

/*
 * O registro usa `animate-pulse`, que só pisca a opacidade. O shimmer (faixa
 * clara atravessando) sinaliza melhor que algo está a caminho, e por ser
 * `background-position` roda na composição, sem layout nem paint.
 *
 * `motion-reduce` desliga a animação e deixa o bloco parado: quem pediu menos
 * movimento no sistema ainda vê o espaço reservado.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn('bg-border/40 kurio-shimmer rounded-input', className)}
      {...props}
    />
  )
}

export { Skeleton }
