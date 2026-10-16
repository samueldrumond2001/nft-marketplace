import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'

import { cn } from '@/lib/utils'

/*
 * O registro traz um item só: círculo com ponto. O design usa duas formas para
 * a mesma escolha única — o círculo na carteira do checkout e a pílula na
 * edição do NFT. As duas saem daqui para compartilhar o primitivo, que é quem
 * dá seta de navegação, roving tabindex e `aria-checked`.
 */
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn('grid gap-2', className)}
      {...props}
    />
  )
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        'border-border data-checked:border-primary data-checked:bg-primary relative flex aspect-square size-3.5 shrink-0 rounded-full border outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator className="bg-ink absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" />
    </RadioPrimitive.Root>
  )
}

/** Variante pílula: o rótulo é o próprio alvo, sem marcador à esquerda. */
function RadioGroupChip({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-chip"
      className={cn(
        'text-3xs border-border text-text-secondary hover:border-border-soft data-checked:border-primary data-checked:text-text-accent rounded-full border px-3 py-1 transition-colors',
        'disabled:cursor-not-allowed disabled:line-through disabled:opacity-40',
        className,
      )}
      {...props}
    />
  )
}

export { RadioGroup, RadioGroupChip, RadioGroupItem }
