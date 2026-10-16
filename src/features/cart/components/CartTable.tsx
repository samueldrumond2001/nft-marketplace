import { Trash2 } from 'lucide-react'

import { ArtImage } from '@/components/ui/ArtImage'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { useRemoveCartItem, useUpdateCartItem } from '../api/cart'
import type { Cart } from '../model/cart'
import { Button } from '@/components/ui/button'

// No desktop a linha é uma tabela de cinco colunas, como no design. No celular
// vira um cartão empilhado: cinco colunas em 375px espremem tudo.
const ROW = 'md:grid md:grid-cols-[1fr_110px_120px_130px_40px] md:items-center md:gap-4'

export function CartTable({ cart }: { cart: Cart }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()

  return (
    <section aria-label="Itens do carrinho">
      <div className={`${ROW} border-border text-foreground hidden border-b pb-3 text-xs`}>
        <span>NFTs</span>
        <span>Preço</span>
        <span>Edições</span>
        <span>Total</span>
        <span className="sr-only">Remover</span>
      </div>

      <ul className="mt-4 space-y-3">
        {cart.items.map((item) => (
          <li
            key={item.id}
            className={`${ROW} bg-surface-card rounded-card flex flex-wrap items-center gap-4 p-3`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-4 md:flex-none">
              <ArtImage
                art={item.image}
                alt=""
                width={56}
                height={56}
                sizes="56px"
                className="rounded-input size-14 shrink-0 object-cover"
              />
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm font-bold">{item.name}</p>
                <p className="text-text-secondary text-3xs">ID do token: {item.tokenId}</p>
                <p className="text-text-accent tabular text-sm font-bold md:hidden">
                  {item.unitPrice} ETH
                </p>
              </div>
            </div>

            <span className="text-text-accent tabular hidden text-sm font-bold md:inline">
              {item.unitPrice} ETH
            </span>

            <QuantityStepper
              value={item.quantity}
              onChange={(quantity) => update.mutate({ itemId: item.id, quantity })}
              label={`Edições de ${item.name}`}
            />

            <span className="text-text-accent tabular text-sm font-bold">
              <span className="sr-only">Total do item: </span>
              {item.lineTotal} ETH
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove.mutate({ itemId: item.id })}
              aria-label={`Remover ${item.name} do carrinho`}
              className="hover:text-text-accent md:justify-self-end"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
