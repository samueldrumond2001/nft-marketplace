import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { ApiError } from '@/lib/http'
import { useApplyPromo } from '../api/cart'
import type { Cart } from '../model/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CartSummary({ cart }: { cart: Cart }) {
  const [code, setCode] = useState('')
  const promo = useApplyPromo()

  const error = promo.error instanceof ApiError ? promo.error : null
  const disabled = cart.items.length === 0

  return (
    <aside aria-label="Resumo da carteira">
      <h2 className="text-foreground border-border border-b pb-3 text-base font-bold">
        Resumo da carteira
      </h2>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (code.trim()) promo.mutate({ code })
        }}
      >
        <Label htmlFor="promo" className="text-foreground block text-xs font-bold">
          Código promocional
        </Label>
        {/* mesmo invólucro do rodapé: campo e botão formam um controle só */}
        <div className="border-primary rounded-btn focus-within:outline-primary mt-2 flex overflow-hidden border focus-within:outline-2 focus-within:outline-offset-2">
          <Input
            id="promo"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Digite o código promocional..."
            aria-invalid={!!error}
            aria-describedby={error ? 'promo-error' : undefined}
            // o invólucro desenha a borda e o anel de foco
            className="min-w-0 flex-1 rounded-none border-0 py-2 aria-[invalid=true]:border-0"
          />
          <Button
            type="submit"
            size="attached"
            disabled={promo.isPending || !code.trim()}
            className="shrink-0 py-2"
          >
            {promo.isPending ? '...' : 'Aplicar'}
          </Button>
        </div>
        {error && (
          <p id="promo-error" role="alert" className="text-3xs text-danger mt-2">
            {error.fields?.code ?? error.message}
          </p>
        )}
        {cart.promoCode && !error && (
          <p className="text-text-accent text-3xs mt-2">Código {cart.promoCode} aplicado.</p>
        )}
      </form>

      <dl className="mt-6 space-y-3 text-sm">
        <Row label="Subtotal" value={`${cart.subtotal} ETH`} />
        <Row label="Desconto do lançamento" value={`(-) ${cart.discount}`} />
        <div>
          <Row label="Taxa de rede" value={`${cart.networkFee} ETH`} />
          <p className="text-text-accent text-3xs mt-1 text-right">Taxa estimada</p>
        </div>
      </dl>

      <div className="border-border mt-4 flex items-baseline justify-between border-t pt-4">
        <span className="text-foreground text-base font-bold">Total</span>
        <span className="text-text-accent tabular text-base font-bold">{cart.total} ETH</span>
      </div>

      <Link
        to="/pagamento"
        disabled={disabled}
        className="bg-primary text-ink rounded-btn mt-5 block py-2.5 text-center text-sm font-bold aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        Conectar e finalizar
      </Link>

      <Link to="/" className="text-text-accent mt-4 block text-center text-sm hover:underline">
        Continuar explorando
      </Link>
    </aside>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-foreground">{label}</dt>
      <dd className="text-foreground tabular">{value}</dd>
    </div>
  )
}
