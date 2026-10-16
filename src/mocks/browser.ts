import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'
import { socketHandlers } from './socket/market'

export const worker = setupWorker(...handlers, ...socketHandlers)
