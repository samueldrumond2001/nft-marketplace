// Superfície pública da feature. O resto é interno (regra no eslint.config.js).
export { useConnectionStatus } from './hooks/useConnection'
export type { ConnectionState } from './hooks/useConnection'
export { useNftSubscription, useOrderSubscription, useRealtime } from './hooks/useRealtime'
export { EVENTS } from './model/events'
export type { NftUpdatedEvent, OrderUpdatedEvent } from './model/events'
