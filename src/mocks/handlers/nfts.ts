import { delay, http, HttpResponse } from 'msw'

import { getNft, getRelatedNfts, listNfts } from '../api/nfts'
import { currentScenario, scenarioDelay } from '../scenarios'

/** Handlers finos: a regra está em `mocks/api`, compartilhada com o middleware do Vite. */
export const nftHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    await delay(scenarioDelay())
    const { status, body } = listNfts(new URL(request.url).searchParams, currentScenario())
    return HttpResponse.json(body, { status })
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(scenarioDelay())
    const { status, body } = getNft(String(params.id))
    return HttpResponse.json(body, { status })
  }),

  http.get('/api/nfts/:id/related', async ({ params }) => {
    await delay(scenarioDelay())
    const { status, body } = getRelatedNfts(String(params.id))
    return HttpResponse.json(body, { status })
  }),
]
