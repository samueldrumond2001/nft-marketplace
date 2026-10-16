import type { Cart, CartItem } from '@/features/cart'
import { formatEth, multiplyWei, parseEth, sumWei } from '@/lib/eth'
import { NFTS } from '../data/nfts'
import type { Scenario } from '../scenarios'
import { currentAccountId } from './auth'
import type { MockResult } from './nfts'

// Taxa fixa, como no design. Um backend real estimaria o gás da rede.
const NETWORK_FEE = '0.016'

const PROMOS: Record<string, number> = {
  KURIO10: 0.1,
  GENESIS: 0.15,
}

interface CartState {
  items: CartItem[]
  promoCode: string | null
}

// Um carrinho por dono, não um só. O visitante tem o dele; ao entrar, o
// conteúdo é mesclado no carrinho da conta. Sem isso, trocar de usuário faria
// o carrinho de um aparecer para o outro — o pior tipo de vazamento entre
// sessões, porque parece funcionar.
const VISITOR = 'visitor'

// No MSW os handlers rodam na página, então sem persistir o carrinho sumiria a
// cada F5. Um backend real guardaria isso com um cookie de sessão; aqui o
// sessionStorage faz o mesmo papel. No middleware do Vite (Node) não existe
// sessionStorage e o estado fica só em memória, o que basta para o dev.
const STORAGE_KEY = 'kurio:mock-cart'

type Carts = Record<string, CartState>

function load(): Carts {
  try {
    const raw = globalThis.sessionStorage?.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Carts
  } catch {
    /* ignora */
  }
  return {}
}

const carts: Carts = load()

function persist(): void {
  try {
    globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(carts))
  } catch {
    /* ignora */
  }
}

function ownerKey(): string {
  return currentAccountId() ?? VISITOR
}

function state(): CartState {
  const key = ownerKey()
  const existing = carts[key]
  if (existing) return existing

  const created: CartState = { items: [], promoCode: null }
  carts[key] = created
  return created
}

/**
 * Chamado logo depois do login/cadastro: o que o visitante montou antes de
 * entrar vai para o carrinho da conta. Quantidades somam quando o item é o
 * mesmo; o cupom da conta tem precedência, porque pode ser dela.
 */
export function mergeVisitorCart(): void {
  const visitor = carts[VISITOR]
  if (!visitor || visitor.items.length === 0) return

  const target = state()
  if (target === visitor) return

  for (const item of visitor.items) {
    const existing = target.items.find((entry) => entry.id === item.id)
    if (existing) {
      existing.quantity += item.quantity
      existing.lineTotal = lineTotal(existing.unitPrice, existing.quantity)
    } else {
      target.items.push(item)
    }
  }

  target.promoCode = target.promoCode ?? visitor.promoCode
  carts[VISITOR] = { items: [], promoCode: null }
  persist()
}

/** Volta ao estado de fábrica: nenhum carrinho, de ninguém. */
export function resetCarts(): void {
  for (const key of Object.keys(carts)) delete carts[key]
  persist()
}

function lineTotal(unitPrice: string, quantity: number): string {
  return formatEth(multiplyWei(parseEth(unitPrice), quantity), { minDecimals: 2 })
}

function buildCart(): Cart {
  const cart = state()
  const subtotalWei = sumWei(cart.items.map((item) => parseEth(item.lineTotal)))
  const rate = cart.promoCode ? (PROMOS[cart.promoCode] ?? 0) : 0

  // desconto em wei, truncado — nada de taxa calculada em float
  const discountWei = (subtotalWei * BigInt(Math.round(rate * 10_000))) / 10_000n
  const feeWei = cart.items.length > 0 ? parseEth(NETWORK_FEE) : 0n

  return {
    id: 'cart-1',
    items: cart.items,
    promoCode: cart.promoCode,
    subtotal: formatEth(subtotalWei),
    discount: formatEth(discountWei),
    networkFee: formatEth(feeWei, { minDecimals: 3 }),
    total: formatEth(subtotalWei - discountWei + feeWei),
  }
}

export function getCart(scenario: Scenario): MockResult {
  if (scenario === 'empty') {
    return { status: 200, body: { ...buildCart(), items: [] } }
  }
  return { status: 200, body: buildCart() }
}

export function addCartItem(body: {
  nftId?: string
  editionLabel?: string
  quantity?: number
}): MockResult {
  const cart = state()
  const nft = NFTS.find((item) => item.id === body.nftId)
  if (!nft) {
    return {
      status: 404,
      body: { error: { code: 'NFT_NOT_FOUND', message: 'NFT não encontrado.' } },
    }
  }
  if (nft.soldOut) {
    return { status: 409, body: { error: { code: 'SOLD_OUT', message: 'Esta edição esgotou.' } } }
  }

  const editionLabel = body.editionLabel ?? '1/50'
  const quantity = Math.max(1, body.quantity ?? 1)
  const existing = cart.items.find(
    (item) => item.nftId === nft.id && item.editionLabel === editionLabel,
  )

  if (existing) {
    existing.quantity += quantity
    existing.lineTotal = lineTotal(existing.unitPrice, existing.quantity)
  } else {
    cart.items.push({
      id: `${nft.id}-${editionLabel.replace('/', '-')}`,
      nftId: nft.id,
      name: nft.name,
      tokenId: nft.tokenId,
      image: nft.image,
      editionLabel,
      unitPrice: nft.price,
      quantity,
      lineTotal: lineTotal(nft.price, quantity),
    })
  }

  persist()
  return { status: 200, body: buildCart() }
}

export function updateCartItem(itemId: string, quantity: number): MockResult {
  const cart = state()
  const item = cart.items.find((entry) => entry.id === itemId)
  if (!item) {
    return {
      status: 404,
      body: { error: { code: 'ITEM_NOT_FOUND', message: 'Item não está no carrinho.' } },
    }
  }

  if (quantity <= 0) return removeCartItem(itemId)

  item.quantity = quantity
  item.lineTotal = lineTotal(item.unitPrice, quantity)
  persist()
  return { status: 200, body: buildCart() }
}

export function removeCartItem(itemId: string): MockResult {
  const cart = state()
  const index = cart.items.findIndex((entry) => entry.id === itemId)
  if (index === -1) {
    return {
      status: 404,
      body: { error: { code: 'ITEM_NOT_FOUND', message: 'Item não está no carrinho.' } },
    }
  }
  cart.items.splice(index, 1)
  if (cart.items.length === 0) cart.promoCode = null
  persist()
  return { status: 200, body: buildCart() }
}

export function applyPromo(code: string, scenario: Scenario): MockResult {
  const cart = state()
  const normalized = code.trim().toUpperCase()

  if (scenario === 'promo-invalid' || !(normalized in PROMOS)) {
    return {
      status: 422,
      body: {
        error: {
          code: 'PROMO_INVALID',
          message: 'Código promocional inválido ou expirado.',
          fields: { code: 'Código inválido' },
        },
      },
    }
  }

  cart.promoCode = normalized
  persist()
  return { status: 200, body: buildCart() }
}

/** Usado pelo checkout para saber o que está sendo comprado. */
export function currentCart(): Cart {
  return buildCart()
}

/**
 * Depois da compra sai do carrinho só o que foi comprado. Antes esvaziava
 * tudo: quem tinha deixado outro item para depois perdia esse item sem aviso,
 * e o enunciado pede exatamente o contrário.
 */
export function removePurchasedItems(itemIds: string[]): void {
  const cart = state()
  cart.items = cart.items.filter((item) => !itemIds.includes(item.id))
  if (cart.items.length === 0) cart.promoCode = null
  persist()
}
