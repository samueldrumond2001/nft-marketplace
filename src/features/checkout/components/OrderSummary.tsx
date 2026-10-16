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
  /** endereço conectado, ou null enquanto a carteira não aceitou */
  connectedAddress?: string | null
  connecting?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
}

export function OrderSummary({
  cart,
  formId,
  wallet,
  onWalletChange,
  submitting,
  error,
  connectedAddress = null,
  connecting = false,
  onConnect,
  onDisconnect,
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

      <WalletConnection
        address={connectedAddress}
        connecting={connecting}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />

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

/*
 * Três estados, porque uma carteira real só tem esses três: desconectada,
 * esperando o aceite dentro da extensão, e conectada com endereço. A recusa
 * não é um quarto estado — é a volta ao primeiro, com o motivo à vista.
 *
 * Confirmar sem estar conectado funciona: o clique conecta e segue. Obrigar
 * a conectar antes seria um passo a mais sem ganho, e quem já conectou vê o
 * endereço que vai assinar.
 */
function WalletConnection({
  address,
  connecting,
  onConnect,
  onDisconnect,
}: {
  address: string | null
  connecting: boolean
  onConnect?: (() => void) | undefined
  onDisconnect?: (() => void) | undefined
}) {
  if (!onConnect) return null

  if (address) {
    return (
      <div className="border-border-soft rounded-card mt-4 flex items-center justify-between gap-3 border px-4 py-3">
        <div className="min-w-0">
          <p className="text-text-accent text-micro font-bold">Carteira conectada</p>
          <p className="text-text-secondary text-micro truncate" title={address}>
            {address.slice(0, 8)}…{address.slice(-6)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onDisconnect} className="shrink-0">
          Desconectar
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={onConnect}
      disabled={connecting}
      className="mt-4 w-full text-xs font-normal"
    >
      {connecting ? 'Aguardando a carteira...' : 'Conectar carteira'}
    </Button>
  )
}
