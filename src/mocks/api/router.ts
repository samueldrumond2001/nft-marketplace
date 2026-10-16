import type { Scenario } from '../scenarios'
import {
  addFavorite,
  changePassword,
  createWallet,
  listFavorites,
  listWallets,
  login,
  logout,
  me,
  refresh,
  register,
  removeFavorite,
  resetAccounts,
  updateProfile,
  updateWallet,
} from './auth'
import {
  addCartItem,
  applyPromo,
  getCart,
  mergeVisitorCart,
  removeCartItem,
  resetCarts,
  updateCartItem,
} from './cart'
import { getNft, getRelatedNfts, listNfts, type MockResult } from './nfts'
import { connectWallet, disconnectWallet, getWallet, resetWallet } from './wallet'
import { createOrder, createQuote, getOrder, resetOrders } from './orders'
import { resetSocketVersions } from '../socket/market'

export interface MockRequest {
  method: string
  pathname: string
  params: URLSearchParams
  body: Record<string, unknown>
  headers: Record<string, string | undefined>
  scenario: Scenario
}

/**
 * Volta tudo ao estado de fábrica. Existe para o teste e para a demonstração:
 * sem isso, um cenário só é confiável na primeira execução da aba.
 */
export function resetMockState(): MockResult {
  resetAccounts()
  resetCarts()
  resetOrders()
  resetWallet()
  resetSocketVersions()
  return { status: 200, body: { ok: true } }
}

/**
 * Entrar e cadastrar levam junto o carrinho do visitante. A mesclagem fica
 * aqui, e não dentro de `login`, porque é a composição de dois recursos: o
 * módulo de contas não precisa conhecer o de carrinho.
 */
function withCartMerge(result: MockResult): MockResult {
  if (result.status === 200 || result.status === 201) mergeVisitorCart()
  return result
}

// Resolve a rota para o middleware do Vite. O MSW casa rotas por conta
// própria; o que os dois compartilham são as funções de cada endpoint.
export function routeMockRequest({
  method,
  pathname,
  params,
  body,
  headers,
  scenario,
}: MockRequest): MockResult | null {
  const cartItemId = /^\/api\/cart\/items\/([^/]+)$/.exec(pathname)?.[1]
  const favoriteId = /^\/api\/favorites\/([^/]+)$/.exec(pathname)?.[1]
  const walletId = /^\/api\/wallets\/([^/]+)$/.exec(pathname)?.[1]

  if (method === 'GET') {
    if (pathname === '/api/nfts') return listNfts(params, scenario)
    if (pathname === '/api/cart') return getCart(scenario)
    if (pathname === '/api/me') return me(scenario)
    if (pathname === '/api/wallets') return listWallets()
    if (pathname === '/api/favorites') return listFavorites()
    if (pathname === '/api/wallet') return getWallet()

    const related = /^\/api\/nfts\/([^/]+)\/related$/.exec(pathname)?.[1]
    if (related) return getRelatedNfts(decodeURIComponent(related))

    const orderId = /^\/api\/orders\/([^/]+)$/.exec(pathname)?.[1]
    if (orderId) return getOrder(decodeURIComponent(orderId))

    const detail = /^\/api\/nfts\/([^/]+)$/.exec(pathname)?.[1]
    if (detail) return getNft(decodeURIComponent(detail))
  }

  if (method === 'POST') {
    if (pathname === '/api/auth/login') return withCartMerge(login(body))
    if (pathname === '/api/auth/register') return withCartMerge(register(body))
    if (pathname === '/api/auth/logout') return logout()
    if (pathname === '/api/auth/refresh') return refresh()
    if (pathname === '/api/me/password') return changePassword(body)
    if (pathname === '/api/wallet/connect') return connectWallet(body, scenario)
    if (pathname === '/api/wallet/disconnect') return disconnectWallet()
    if (pathname === '/api/wallets') return createWallet(body)
    if (pathname === '/api/cart/items') return addCartItem(body)
    if (pathname === '/api/cart/promo') {
      return applyPromo(typeof body.code === 'string' ? body.code : '', scenario)
    }
    if (pathname === '/api/checkout/quote') return createQuote()
    if (pathname === '/api/orders') {
      return createOrder(headers['idempotency-key'] ?? null, body, scenario)
    }
    if (pathname === '/api/__mock/reset') return resetMockState()
  }

  if (method === 'PUT' && favoriteId) return addFavorite(decodeURIComponent(favoriteId), scenario)
  if (method === 'DELETE' && favoriteId) {
    return removeFavorite(decodeURIComponent(favoriteId), scenario)
  }

  if (method === 'PATCH' && pathname === '/api/me') return updateProfile(body)
  if (method === 'PATCH' && walletId) return updateWallet(decodeURIComponent(walletId), body)

  if (method === 'PATCH' && cartItemId) {
    return updateCartItem(cartItemId, Number(body.quantity ?? 0))
  }

  if (method === 'DELETE' && cartItemId) {
    return removeCartItem(cartItemId)
  }

  return null
}
