import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'

import { cn } from '@/lib/utils'

/*
 * Tabs do shadcn/ui reduzidas à variante que o Figma usa: barra inferior com
 * sublinhado no item ativo. A tabela de variantes do registro (pílula sobre
 * fundo cinza) não aparece em nenhuma tela, então sairia como código morto.
 *
 * O primitivo é o que importa aqui: seta esquerda/direita, roving tabindex e
 * a ligação `aria-controls`/`aria-labelledby` entre aba e painel vêm dele.
 */
function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col', className)} {...props} />
  )
}

function TabsList({ className, activateOnFocus = true, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      // o Base UI vem com ativação manual (seta move, Enter escolhe). Com dois
      // painéis de texto a ativação automática é a que a WAI-ARIA recomenda:
      // menos uma tecla e nada se perde.
      activateOnFocus={activateOnFocus}
      className={cn('border-border flex items-center gap-8 border-b', className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'text-foreground hover:text-text-accent data-selected:text-text-accent relative pb-3 text-sm transition-colors outline-none',
        // o sublinhado desce 1px para cobrir a borda da lista
        'after:bg-primary after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:opacity-0 data-selected:after:opacity-100',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('pt-8 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
