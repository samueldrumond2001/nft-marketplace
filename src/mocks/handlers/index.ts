import type { RequestHandler } from 'msw'
import { http, HttpResponse } from 'msw'

import { isOffline } from '../scenarios'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'

/*
 * Primeiro da fila: no cenário `offline` toda chamada falha no transporte,
 * como quando o aparelho perde o sinal — sem status, sem corpo. Fora dele o
 * resolver não devolve nada e o MSW segue para o handler seguinte.
 */
const offline = http.all('/api/*', () => (isOffline() ? HttpResponse.error() : undefined))

export const handlers: RequestHandler[] = [
  offline,
  ...nftHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...authHandlers,
]
