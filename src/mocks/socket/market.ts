import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import { markSoldOut } from '../api/nfts'
import { peekOrder } from '../api/orders'
import { NFTS } from '../data/nfts'
import { currentScenario, isSocketDown } from '../scenarios'

// o socket.io conecta em /socket.io/?EIO=4&transport=websocket; o padrão
// casa o caminho, a query o MSW ignora
const market = ws.link('ws://kurio.local/*')

// Versão por recurso, crescente. É o que deixa o cliente descartar duplicata
// e evento atrasado; um servidor real usaria o número de revisão da linha.
const versions = new Map<string, number>()

function nextVersion(key: string): number {
  const next = (versions.get(key) ?? 0) + 1
  versions.set(key, next)
  return next
}

// Só o que o desafio precisa demonstrar; um servidor real empurraria eventos
// por conta própria, aqui eles saem da assinatura do cliente.
export const socketHandlers = [
  market.addEventListener('connection', (connection) => {
    // servidor de tempo real fora do ar: a conexão cai na hora, e o cliente
    // trata como queda — é o que acontece num deploy ou numa rede ruim
    if (isSocketDown()) {
      connection.client.close()
      return
    }

    const io = toSocketIo(connection)
    const timers: ReturnType<typeof setInterval>[] = []

    io.client.on('subscribe:nft', (_event, payload: { nftId?: string }) => {
      const nft = NFTS.find((item) => item.id === payload?.nftId)
      if (!nft) return

      if (currentScenario() === 'price-changed') {
        setTimeout(() => {
          const event = {
            nftId: nft.id,
            version: nextVersion(`nft:${nft.id}`),
            price: (Number(nft.price) + 0.5).toFixed(2),
            previousPrice: nft.price,
            at: new Date().toISOString(),
          }

          io.client.emit('nft.updated', event)

          // Reentrega de propósito: a mesma versão e uma versão antiga. O
          // cliente tem que ignorar as duas, senão o preço volta sozinho.
          setTimeout(() => {
            io.client.emit('nft.updated', event)
            io.client.emit('nft.updated', {
              ...event,
              version: event.version - 1,
              price: nft.price,
            })
          }, 150)
        }, 600)
      }

      if (currentScenario() === 'sold-out') {
        setTimeout(() => {
          markSoldOut(nft.id)
          io.client.emit('nft.updated', {
            nftId: nft.id,
            version: nextVersion(`nft:${nft.id}`),
            editionId: '1-50',
            remaining: 0,
            soldOut: true,
            at: new Date().toISOString(),
          })
        }, 600)
      }
    })

    io.client.on('subscribe:order', (_event, payload: { orderId?: string }) => {
      const orderId = payload?.orderId
      if (!orderId) return

      let last: string | null = null
      const timer = setInterval(() => {
        const order = peekOrder(orderId)
        if (!order || order.status === last) return

        last = order.status
        io.client.emit('order.updated', {
          orderId,
          version: nextVersion(`order:${orderId}`),
          status: order.status,
          txHash: order.txHash,
          reason: order.failureReason,
          at: new Date().toISOString(),
        })

        if (order.status !== 'PENDING') clearInterval(timer)
      }, 300)

      timers.push(timer)
    })

    connection.client.addEventListener('close', () => {
      for (const timer of timers) clearInterval(timer)
    })
  }),
]

/** Zera as versões junto com o resto do estado, no reset de cenário. */
export function resetSocketVersions(): void {
  versions.clear()
}
