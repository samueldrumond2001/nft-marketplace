import type { Order } from '@/features/checkout'
import { NFTS } from '../data/nfts'
import type { Scenario } from '../scenarios'
import { currentCart, removePurchasedItems } from './cart'
import type { MockResult } from './nfts'

const QUOTE_TTL_MS = 10 * 60_000

// Pedidos indexados pela Idempotency-Key. É o que faz clique duplo, reload no
// meio do POST e retry depois de 5xx devolverem o mesmo pedido em vez de criar
// outro. Um backend real guardaria isso com TTL.
const byIdempotencyKey = new Map<string, Order>()

// Impressão do conteúdo que gerou cada chave. Reusar a chave com outro
// conteúdo não é retry, é erro de quem chama: a resposta tem que ser 409, não
// o pedido antigo — senão o cliente acha que comprou o que acabou de mandar.
const fingerprints = new Map<string, string>()
const byId = new Map<string, Order>()

// Quantas vezes cada chave já foi tentada, para o cenário de falha transitória
const attempts = new Map<string, number>()

let quoteCounter = 0

/*
 * A cotação é o ponto de revalidação antes de confirmar: entre montar o
 * carrinho e clicar em comprar, uma edição pode ter esgotado. Devolver o total
 * sem conferir seria cobrar por algo que não existe mais.
 */
export function createQuote(): MockResult {
  const cart = currentCart()

  const unavailable = cart.items.find((item) => NFTS.find((nft) => nft.id === item.nftId)?.soldOut)
  if (unavailable) {
    return {
      status: 409,
      body: {
        error: {
          code: 'ITEM_UNAVAILABLE',
          message: `${unavailable.name} esgotou enquanto você decidia. Revise o carrinho.`,
        },
      },
    }
  }

  quoteCounter += 1

  return {
    status: 200,
    body: {
      quoteId: `quote-${quoteCounter}`,
      subtotal: cart.subtotal,
      discount: cart.discount,
      networkFee: cart.networkFee,
      total: cart.total,
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    },
  }
}

function randomTxHash(): string {
  const hex = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16)
      .toString(16)
      .toUpperCase(),
  ).join('')
  return `0x${hex}…${hex.slice(0, 4)}`
}

export function createOrder(
  idempotencyKey: string | null,
  body: { walletType?: unknown },
  scenario: Scenario,
): MockResult {
  if (!idempotencyKey) {
    return {
      status: 400,
      body: {
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'Idempotency-Key é obrigatório.' },
      },
    }
  }

  const fingerprint = JSON.stringify({
    walletType: body.walletType ?? null,
    items: currentCart().items.map((item) => [item.id, item.quantity]),
    total: currentCart().total,
  })

  const knownFingerprint = fingerprints.get(idempotencyKey)
  if (knownFingerprint !== undefined && knownFingerprint !== fingerprint) {
    return {
      status: 409,
      body: {
        error: {
          code: 'IDEMPOTENCY_KEY_REUSED',
          message: 'Esta chave já foi usada para outra compra. Recarregue o checkout.',
        },
      },
    }
  }

  // Antes de qualquer validação: se a chave já criou um pedido, devolve o
  // mesmo. Essa é a razão de existir da chave.
  const existing = byIdempotencyKey.get(idempotencyKey)
  if (existing) return { status: 200, body: existing }

  fingerprints.set(idempotencyKey, fingerprint)

  const attempt = (attempts.get(idempotencyKey) ?? 0) + 1
  attempts.set(idempotencyKey, attempt)

  // Falha transitória: cai na primeira tentativa e passa na segunda. É assim
  // que dá para ver que o retry reusa a chave em vez de criar outro pedido.
  if (scenario === 'network-error' && attempt === 1) {
    return {
      status: 500,
      body: {
        error: { code: 'UPSTREAM_ERROR', message: 'Falha ao contactar a rede. Tente de novo.' },
      },
    }
  }

  if (scenario === 'price-changed') {
    return {
      status: 409,
      body: {
        error: {
          code: 'QUOTE_EXPIRED',
          message: 'O preço de um dos itens mudou. Revise o carrinho antes de confirmar.',
        },
      },
    }
  }

  const cart = currentCart()
  if (cart.items.length === 0) {
    return {
      status: 422,
      body: { error: { code: 'EMPTY_CART', message: 'Não há itens para comprar.' } },
    }
  }

  const order: Order = {
    id: `order-${byId.size + 1}`,
    status: 'PENDING',
    txHash: null,
    walletType: typeof body.walletType === 'string' ? body.walletType : 'metamask',
    items: cart.items,
    subtotal: cart.subtotal,
    discount: cart.discount,
    networkFee: cart.networkFee,
    total: cart.total,
    createdAt: new Date().toISOString(),
    failureReason: null,
  }

  byIdempotencyKey.set(idempotencyKey, order)
  byId.set(order.id, order)
  removePurchasedItems(order.items.map((item) => item.id))

  // A rede leva um tempo para confirmar. Na etapa do tempo real quem avisa é o
  // socket; até lá a tela de pedido consulta até sair de PENDING.
  const settle = () => {
    const stored = byId.get(order.id)
    if (!stored || stored.status !== 'PENDING') return

    if (scenario === 'payment-failed') {
      stored.status = 'FAILED'
      stored.failureReason = 'A carteira recusou a transação.'
    } else {
      stored.status = 'CONFIRMED'
      stored.txHash = randomTxHash()
    }
  }
  setTimeout(settle, 2000)

  return { status: 201, body: order }
}

export function getOrder(id: string): MockResult {
  const order = byId.get(id)
  if (!order) {
    return {
      status: 404,
      body: { error: { code: 'ORDER_NOT_FOUND', message: 'Pedido não encontrado.' } },
    }
  }
  return { status: 200, body: order }
}

/** Leitura direta usada pelo mock de socket para avisar quando o status muda. */
export function peekOrder(id: string): Order | undefined {
  return byId.get(id)
}

/** Esquece pedidos e chaves de idempotência. Usado pelo reset de cenário. */
export function resetOrders(): void {
  byIdempotencyKey.clear()
  fingerprints.clear()
  byId.clear()
  attempts.clear()
  quoteCounter = 0
}
