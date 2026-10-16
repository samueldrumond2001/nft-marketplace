import { delay, http, HttpResponse } from 'msw'

import { createOrder, createQuote, getOrder } from '../api/orders'
import { connectWallet, disconnectWallet, getWallet } from '../api/wallet'
import { currentScenario, scenarioDelay } from '../scenarios'

export const orderHandlers = [
  http.post('/api/checkout/quote', async () => {
    await delay(scenarioDelay())
    const { status, body } = createQuote()
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(scenarioDelay())
    const body = (await request.json()) as Record<string, unknown>
    const result = createOrder(request.headers.get('Idempotency-Key'), body, currentScenario())
    return HttpResponse.json(result.body, { status: result.status })
  }),

  http.get('/api/orders/:id', async ({ params }) => {
    await delay(scenarioDelay())
    const { status, body } = getOrder(String(params.id))
    return HttpResponse.json(body, { status })
  }),

  http.get('/api/wallet', async () => {
    await delay(scenarioDelay())
    const { status, body } = getWallet()
    return HttpResponse.json(body, { status })
  }),

  http.post('/api/wallet/connect', async ({ request }) => {
    // a extensão demora um pouco mais que a rede: é o tempo de a pessoa
    // olhar o pedido e clicar
    await delay(scenarioDelay() + 300)
    const body = (await request.json()) as Record<string, unknown>
    const { status, body: payload } = connectWallet(body, currentScenario())
    return HttpResponse.json(payload, { status })
  }),

  http.post('/api/wallet/disconnect', async () => {
    await delay(scenarioDelay())
    const { status, body } = disconnectWallet()
    return HttpResponse.json(body, { status })
  }),
]
