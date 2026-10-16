import { delay, http, HttpResponse } from 'msw'

import { createOrder, createQuote, getOrder } from '../api/orders'
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
]
