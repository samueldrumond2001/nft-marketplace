import { Link } from '@tanstack/react-router'

import { ArtImage } from '@/components/ui/ArtImage'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Cart } from '@/features/cart'
import { cn } from '@/lib/utils'
import { WALLET_TYPES } from '../model/checkout'

interface OrderSummaryProps {
  cart: Cart
  formId: string
  wallet: string
  onWalletChange: (wallet: string) => void
  submitting: boolean
  error?: string | undefined
}

export function OrderSummary({
  cart,
  formId,
  wallet,
  onWalletChange,
  submitting,
  error,
}: OrderSummaryProps) {
  return (
    <aside aria-label="Seus NFTs">
      <h2 className="text-foreground text-base font-bold">Seus NFTs</h2>

      <div className="border-border mt-3 flex items-baseline justify-between border-b pb-2 text-xs">
        <span className="text-foreground">NFTs</span>
        <span className="text-foreground">Subtotal</span>
      </div>

      <ul className="mt-3 space-y-2">
        {cart.items.map((item) => (
          <li key={item.id} className="bg-surface-card rounded-card flex items-center gap-3 p-2.5">
            <ArtImage
              art={item.image}
              alt=""
              width={44}
              height={44}
              sizes="44px"
              className="rounded-input size-11 shrink-0 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-xs font-bold">{item.name}</p>
              <p className="text-text-secondary text-micro">ID do token: {item.tokenId}</p>
            </div>
            <span className="text-text-secondary text-3xs shrink-0">(x {item.quantity})</span>
            <span className="text-text-accent tabular shrink-0 text-xs font-bold">
              {item.lineTotal} ETH
            </span>
          </li>
        ))}
      </ul>

      <p className="text-text-secondary text-3xs mt-3 text-center">
        Tem um código promocional?{' '}
        <Link to="/carrinho" className="text-text-accent hover:underline">
          Aplique aqui
        </Link>
      </p>

      <dl className="mt-4 space-y-2.5 text-xs">
        <Row label="Subtotal" value={`${cart.subtotal} ETH`} />
        <Row label="Desconto do lançamento" value={`(-) ${cart.discount}`} />
        <div>
          <Row label="Taxa de rede" value={`${cart.networkFee} ETH`} />
          <p className="text-text-accent text-micro mt-1 text-center">Taxa estimada</p>
        </div>
      </dl>

      <div className="border-border mt-3 flex items-baseline justify-center gap-10 border-t pt-3">
        <span className="text-foreground text-base font-bold">Total</span>
        <span className="text-text-accent tabular text-base font-bold">{cart.total} ETH</span>
      </div>

      <h3 className="text-foreground mt-4 text-center text-base font-bold">Carteira e rede</h3>

      <RadioGroup
        aria-label="Escolha a carteira"
        value={wallet}
        onValueChange={(next) => onWalletChange(String(next))}
        className="mt-3 gap-2.5"
      >
        {WALLET_TYPES.map((option) => (
          <Label
            key={option.value}
            // Radio.Root é um botão, então o label nativo não o ativa sozinho
            onClick={() => onWalletChange(option.value)}
            className={cn(
              'rounded-card cursor-pointer gap-3 border px-4 py-3 text-xs transition-colors',
              wallet === option.value
                ? 'border-primary text-foreground'
                : 'border-border text-text-secondary hover:border-border-soft',
            )}
          >
            <RadioGroupItem value={option.value} />
            {option.label}
          </Label>
        ))}
      </RadioGroup>

      {error && (
        <p role="alert" className="text-3xs text-danger mt-4">
          {error}
        </p>
      )}

      <Button
        type="submit"
        form={formId}
        disabled={submitting || cart.items.length === 0}
        className="mt-4 w-full"
      >
        {submitting ? 'Confirmando...' : 'Confirmar compra'}
      </Button>
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
