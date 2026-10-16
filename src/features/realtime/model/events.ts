import { z } from 'zod'

/*
 * Dois eventos, um por recurso, como o enunciado pede: `nft.updated` e
 * `order.updated`. Um evento por tipo de mudança (preço, estoque, venda)
 * obrigaria a inventar um nome novo a cada campo que mudasse; aqui o evento
 * diz "este recurso mudou, eis o que mudou".
 *
 * `version` é o que torna a entrega segura: a rede entrega fora de ordem e
 * repete. Com um número que só cresce por recurso, o cliente ignora o que já
 * viu e o que é mais velho do que o estado atual, sem precisar de relógio.
 */
const baseEvent = z.object({
  version: z.number().int().nonnegative(),
  at: z.string().optional(),
})

export const nftUpdatedEvent = baseEvent.extend({
  nftId: z.string(),
  // parciais: o evento carrega só os campos que mudaram
  price: z.string().optional(),
  previousPrice: z.string().nullable().optional(),
  editionId: z.string().optional(),
  remaining: z.number().int().nonnegative().optional(),
  soldOut: z.boolean().optional(),
})

export const orderUpdatedEvent = baseEvent.extend({
  orderId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']),
  txHash: z.string().nullable(),
  reason: z.string().nullable(),
})

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEvent>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEvent>

export const EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const
