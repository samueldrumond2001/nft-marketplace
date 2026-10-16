import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/*
 * Button do shadcn/ui com a tabela de variantes trocada pela do Figma. O
 * registro entrega uma escala genérica (h-8, rounded-lg, cinzas); o que ficou
 * dele é o que vale a pena: o primitivo do Base UI, o `data-slot` e a cva.
 * Trocar a tabela aqui, uma vez, evita uma sequência de className de correção
 * em cada chamada.
 */
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        solid: 'bg-primary text-ink hover:bg-text-accent',
        outline: 'border-primary text-primary hover:bg-primary hover:text-ink border',
        ghost: 'text-text-secondary hover:text-foreground',
        link: 'text-text-accent underline-offset-4 hover:underline',
        // ação redonda sobreposta à arte do card
        overlay: 'bg-ink/85 text-foreground hover:bg-primary hover:text-ink rounded-full',
      },
      size: {
        // CTA de formulário e de carrinho: largura vem de quem chama
        default: 'rounded-btn px-6 py-2.5 text-sm font-bold',
        sm: 'rounded-btn px-3 py-1.5 text-sm',
        // botão colado a um input (cupom, busca): mesma altura, canto reto
        attached: 'px-4 py-2.5 text-xs font-medium',
        icon: 'size-8',
        'icon-sm': 'size-[22px]',
      },
    },
    defaultVariants: { variant: 'solid', size: 'default' },
  },
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
