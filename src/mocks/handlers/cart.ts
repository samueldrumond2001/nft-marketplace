import { delay, http, HttpResponse } from 'msw'

import { addCartItem, applyPromo, getCart, removeCartItem, updateCartItem } from '../api/cart'
import { currentScenario, scenarioDelay } from '../scenarios'

export const cartHandlers = [
  http.get('/api/cart', async () => {
    await delay(scenarioDelay())
    const { status, body } = getCart(currentScenario())
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await delay(scenarioDelay())
    const body = (await request.json()) as Record<string, unknown>
    const result = addCartItem(body)
    return HttpResponse.json(result.body, { status: result.status })
  }),

  http.patch('/api/cart/items/:itemId', async ({ params, request }) => {
    await delay(scenarioDelay())
    const body = (await request.json()) as { quantity?: number }
    const result = updateCartItem(String(params.itemId), Number(body.quantity ?? 0))
    return HttpResponse.json(result.body, { status: result.status })
  }),

  http.delete('/api/cart/items/:itemId', async ({ params }) => {
    await delay(scenarioDelay())
    const result = removeCartItem(String(params.itemId))
    return HttpResponse.json(result.body, { status: result.status })
  }),

  http.post('/api/cart/promo', async ({ request }) => {
    await delay(scenarioDelay())
    const body = (await request.json()) as { code?: string }
    const result = applyPromo(String(body.code ?? ''), currentScenario())
    return HttpResponse.json(result.body, { status: result.status })
  }),
]
