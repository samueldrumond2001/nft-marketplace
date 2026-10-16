import { delay, http, HttpResponse } from 'msw'

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
  updateProfile,
  updateWallet,
} from '../api/auth'
import { mergeVisitorCart } from '../api/cart'
import { resetMockState } from '../api/router'
import { currentScenario, scenarioDelay } from '../scenarios'

const json = async (request: Request) => (await request.json()) as Record<string, unknown>

// Entrar leva junto o carrinho do visitante; a mesclagem é a mesma do
// middleware do Vite, só chamada de outro transporte.
function withCartMerge<T>(result: { status: number; body: T }) {
  if (result.status === 200 || result.status === 201) mergeVisitorCart()
  return result
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(scenarioDelay())
    const { status, body } = withCartMerge(login(await json(request)))
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(scenarioDelay())
    const { status, body } = withCartMerge(register(await json(request)))
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/auth/logout', async () => {
    await delay(scenarioDelay())
    const { status, body } = logout()
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/auth/refresh', async () => {
    await delay(scenarioDelay())
    const { status, body } = refresh()
    return HttpResponse.json(body, { status })
  }),

  http.get('/api/me', async () => {
    await delay(scenarioDelay())
    const { status, body } = me(currentScenario())
    return HttpResponse.json(body, { status })
  }),

  http.patch('/api/me', async ({ request }) => {
    await delay(scenarioDelay())
    const { status, body } = updateProfile(await json(request))
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/me/password', async ({ request }) => {
    await delay(scenarioDelay())
    const { status, body } = changePassword(await json(request))
    return HttpResponse.json(body, { status })
  }),

  http.get('/api/wallets', async () => {
    await delay(scenarioDelay())
    const { status, body } = listWallets()
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/wallets', async ({ request }) => {
    await delay(scenarioDelay())
    const { status, body } = createWallet(await json(request))
    return HttpResponse.json(body, { status })
  }),

  http.patch('/api/wallets/:walletId', async ({ params, request }) => {
    await delay(scenarioDelay())
    const { status, body } = updateWallet(String(params.walletId), await json(request))
    return HttpResponse.json(body, { status })
  }),

  http.get('/api/favorites', async () => {
    await delay(scenarioDelay())
    const { status, body } = listFavorites()
    return HttpResponse.json(body, { status })
  }),

  http.put('/api/favorites/:nftId', async ({ params }) => {
    await delay(scenarioDelay())
    const { status, body } = addFavorite(String(params.nftId), currentScenario())
    return HttpResponse.json(body, { status })
  }),

  http.delete('/api/favorites/:nftId', async ({ params }) => {
    await delay(scenarioDelay())
    const { status, body } = removeFavorite(String(params.nftId), currentScenario())
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/__mock/reset', () => {
    const { status, body } = resetMockState()
    return HttpResponse.json(body, { status })
  }),
]
