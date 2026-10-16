import type * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '@/lib/utils'

/*
 * Base do registro com as classes do Figma: borda discreta sobre fundo
 * transparente, raio de 4px. O `aria-invalid` continua pintando a borda — é o
 * mesmo atributo que o React Hook Form já marca, então erro de validação
 * aparece sem o formulário saber de estilo.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'border-border text-foreground rounded-input w-full min-w-0 border bg-transparent px-3 py-2.5 text-xs transition-colors outline-none',
        'hover:border-border-soft focus-visible:border-primary',
        'aria-[invalid=true]:border-danger',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
