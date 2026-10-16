import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { X } from 'lucide-react'

import { ArtImage } from '@/components/ui/ArtImage'
import { orderQuery, type Order } from '@/features/checkout'
import { useOrderSubscription } from '@/features/realtime'

export const Route = createFileRoute('/pedido/$orderId')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(orderQuery(params.orderId)),
  component: OrderPage,
})

function OrderPage() {
  const { orderId } = Route.useParams()
  const { data: order } = useQuery(orderQuery(orderId))
  useOrderSubscription(orderId)

  if (!order) return null

  return (
    <div className="flex justify-center px-4 py-16">
      <div className="bg-surface-card rounded-modal relative w-full max-w-[578px] overflow-hidden">
        <Link
          to="/"
          aria-label="Fechar e voltar ao início"
          className="text-text-secondary hover:text-text-accent absolute top-4 right-4 transition-colors"
        >
          <X className="size-4" />
        </Link>

        {order.status === 'PENDING' && <Pending />}
        {order.status === 'FAILED' && <Failed order={order} />}
        {order.status === 'CONFIRMED' && <Confirmed order={order} />}

        <div className="bg-primary h-1.5" />
      </div>
    </div>
  )
}

function Pending() {
  return (
    <div className="px-8 py-16 text-center" aria-live="polite">
      <div className="border-primary mx-auto size-10 animate-spin rounded-full border-2 border-t-transparent" />
      <h1 className="text-foreground mt-6 text-base">Confirmando sua transação na rede...</h1>
      <p className="text-text-secondary mt-2 text-xs">
        Isso costuma levar alguns segundos. Pode deixar esta página aberta.
      </p>
    </div>
  )
}

function Failed({ order }: { order: Order }) {
  return (
    <div className="px-8 py-16 text-center" aria-live="polite">
      <h1 className="text-foreground text-base font-bold">A transação não foi concluída</h1>
      <p role="alert" className="text-text-secondary mt-3 text-xs">
        {order.failureReason ?? 'Não foi possível concluir a compra.'}
      </p>
      <Link
        to="/carrinho"
        className="bg-primary text-ink rounded-btn mt-8 inline-block px-6 py-2.5 text-xs font-bold"
      >
        Voltar ao carrinho
      </Link>
    </div>
  )
}

function Confirmed({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <>
      <div className="px-8 pt-10 pb-6 text-center">
        <ThankYouMark />
        <h1 className="text-foreground mt-4 text-sm">Seus NFTs agora estão na sua carteira</h1>
      </div>

      <dl className="border-border text-3xs grid grid-cols-2 gap-4 border-y px-8 py-4 sm:grid-cols-4">
        <Fact label="ID da transação" value={order.txHash ?? '—'} strong />
        <Fact label="Data" value={date} />
        <Fact label="Total" value={`${order.total} ETH`} />
        <Fact label="Carteira" value={order.walletType} strong />
      </dl>

      <div className="px-8 py-6">
        <h2 className="text-foreground text-xs font-bold">Detalhes da transação</h2>

        <div className="text-foreground text-3xs mt-3 grid grid-cols-[1fr_70px_90px] gap-3">
          <span>NFTs</span>
          <span className="text-center">Edições</span>
          <span className="text-right">Subtotal</span>
        </div>

        <ul className="mt-2 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="grid grid-cols-[1fr_70px_90px] items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ArtImage
                  art={item.image}
                  alt=""
                  width={44}
                  height={44}
                  sizes="44px"
                  className="rounded-input size-11 shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <p className="text-foreground truncate text-xs font-bold">{item.name}</p>
                  <p className="text-text-secondary text-micro">ID do token: {item.tokenId}</p>
                </div>
              </div>
              <span className="text-text-secondary text-3xs text-center">(x {item.quantity})</span>
              <span className="text-text-accent tabular text-right text-xs font-bold">
                {item.lineTotal} ETH
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 text-xs">
          <div className="flex justify-center gap-10">
            <dt className="text-foreground">Taxa de rede</dt>
            <dd className="text-foreground tabular">{order.networkFee} ETH</dd>
          </div>
          <div className="flex justify-center gap-10">
            <dt className="text-foreground font-bold">Total</dt>
            <dd className="text-text-accent tabular font-bold">{order.total} ETH</dd>
          </div>
        </dl>

        <p className="text-text-secondary text-3xs mt-5 text-center">
          Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira
          conectada e registrada na rede.
        </p>

        <div className="mt-6 text-center">
          <a
            href="https://etherscan.io"
            target="_blank"
            rel="noreferrer noopener"
            className="bg-primary text-ink rounded-btn inline-block px-6 py-2.5 text-xs font-bold"
          >
            Ver no Etherscan
          </a>
        </div>
      </div>
    </>
  )
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className={strong ? 'text-foreground font-bold' : 'text-text-secondary'}>{label}</dt>
      <dd className="text-text-secondary mt-0.5 break-all">{value}</dd>
    </div>
  )
}

function ThankYouMark() {
  return (
    <svg
      viewBox="0 0 64 60"
      role="img"
      aria-label="Obrigado"
      className="text-primary mx-auto size-16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="18" y="4" width="28" height="22" rx="2" />
      <text
        x="32"
        y="13"
        textAnchor="middle"
        fontSize="7"
        fill="currentColor"
        stroke="none"
        fontFamily="inherit"
      >
        THANK
      </text>
      <text
        x="32"
        y="21"
        textAnchor="middle"
        fontSize="7"
        fill="currentColor"
        stroke="none"
        fontFamily="inherit"
      >
        YOU
      </text>
      <path d="M4 26h56v30H4z" />
      <path d="M4 26l28 20 28-20" />
    </svg>
  )
}
