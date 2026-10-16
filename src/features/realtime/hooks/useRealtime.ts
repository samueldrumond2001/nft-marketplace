import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { CART_KEY } from '@/features/cart'
import type { NftList, NftSummary } from '@/features/marketplace'
import { connectSocket } from '@/lib/socket'
import { EVENTS, nftUpdatedEvent, orderUpdatedEvent } from '../model/events'

/**
 * O socket não é fonte da verdade — é aviso de que algo mudou.
 *
 * Evento que só muda exibição (preço na listagem) é escrito direto no cache.
 * Evento que mexe no valor a pagar invalida a query e deixa o REST responder:
 * calcular total a partir de websocket é apostar que nenhuma mensagem se
 * perdeu, e elas se perdem.
 */
function applyNftPatch(queryClient: QueryClient, event: { nftId: string } & Partial<NftSummary>) {
  const { nftId, ...fields } = event

  const patch = (nft: NftSummary): NftSummary => (nft.id === nftId ? { ...nft, ...fields } : nft)

  queryClient.setQueriesData<NftList>({ queryKey: ['nfts'] }, (list) =>
    list ? { ...list, items: list.items.map(patch) } : list,
  )
  queryClient.setQueriesData<NftSummary>({ queryKey: ['nft', nftId] }, (nft) =>
    nft ? patch(nft) : nft,
  )

  // o carrinho é dinheiro: não adivinha, pergunta
  void queryClient.invalidateQueries({ queryKey: CART_KEY })
}

/**
 * Guarda a última versão aplicada por recurso. Evento repetido ou atrasado
 * tem versão menor ou igual e é descartado — sem isso, uma reentrega faria o
 * preço voltar ao valor antigo, que é pior do que não receber nada.
 */
function useVersionGate() {
  const seen = useRef(new Map<string, number>())

  // identidade estável: o portão entra na dependência do efeito que assina o
  // socket, e um objeto novo a cada render refaria a assinatura sem parar
  return useMemo(
    () => ({
      accept(key: string, version: number) {
        const last = seen.current.get(key)
        if (last !== undefined && version <= last) return false
        seen.current.set(key, version)
        return true
      },
      // depois de uma reconexão não dá para saber o que se perdeu enquanto o
      // socket esteve fora: o histórico de versões é zerado e o REST recompõe
      reset() {
        seen.current.clear()
      },
    }),
    [],
  )
}

export function useRealtime() {
  const queryClient = useQueryClient()
  const versions = useVersionGate()

  useEffect(() => {
    let disposed = false
    let detach = () => {}

    void connectSocket().then((socket) => {
      if (disposed) return

      const onNft = (raw: unknown) => {
        const parsed = nftUpdatedEvent.safeParse(raw)
        if (!parsed.success) return

        const { nftId, version, ...fields } = parsed.data
        if (!versions.accept(`nft:${nftId}`, version)) return

        const patch: { nftId: string } & Partial<NftSummary> = { nftId }
        if (fields.price !== undefined) patch.price = fields.price
        if (fields.previousPrice !== undefined) patch.previousPrice = fields.previousPrice
        if (fields.soldOut !== undefined) patch.soldOut = fields.soldOut
        if (fields.remaining === 0) patch.soldOut = true

        applyNftPatch(queryClient, patch)

        // Disponibilidade muda o que dá para comprar, então vale reconsultar:
        // o REST é quem sabe quantas edições sobraram. Preço não — a mudança
        // veio do evento, e refazer a consulta traria o valor antigo de volta
        // até o servidor publicar o novo.
        if (fields.soldOut !== undefined || fields.remaining !== undefined) {
          void queryClient.invalidateQueries({ queryKey: ['nft', nftId] })
        }
      }

      const onOrder = (raw: unknown) => {
        const parsed = orderUpdatedEvent.safeParse(raw)
        if (!parsed.success) return
        if (!versions.accept(`order:${parsed.data.orderId}`, parsed.data.version)) return

        void queryClient.invalidateQueries({ queryKey: ['order', parsed.data.orderId] })
      }

      /*
       * Reconciliação depois de reconectar. Enquanto o socket esteve fora,
       * eventos aconteceram e ninguém os recebeu; confiar no que chegar
       * depois deixaria a tela parada num estado antigo. O REST é quem sabe.
       */
      const onReconnect = () => {
        versions.reset()
        void queryClient.invalidateQueries({ queryKey: ['nfts'] })
        void queryClient.invalidateQueries({ queryKey: ['nft'] })
        void queryClient.invalidateQueries({ queryKey: ['order'] })
        void queryClient.invalidateQueries({ queryKey: CART_KEY })
      }

      socket.on(EVENTS.nftUpdated, onNft)
      socket.on(EVENTS.orderUpdated, onOrder)
      socket.io.on('reconnect', onReconnect)

      detach = () => {
        socket.off(EVENTS.nftUpdated, onNft)
        socket.off(EVENTS.orderUpdated, onOrder)
        socket.io.off('reconnect', onReconnect)
      }
    })

    return () => {
      disposed = true
      detach()
    }
  }, [queryClient, versions])
}

function useSubscription(channel: 'nft' | 'order', id: string | undefined) {
  useEffect(() => {
    if (!id) return
    let disposed = false

    void connectSocket().then((socket) => {
      if (disposed) return
      socket.emit(`subscribe:${channel}`, channel === 'nft' ? { nftId: id } : { orderId: id })
    })

    return () => {
      disposed = true
      void connectSocket().then((socket) => {
        socket.emit(`unsubscribe:${channel}`, channel === 'nft' ? { nftId: id } : { orderId: id })
      })
    }
  }, [channel, id])
}

/** Assina as atualizações de um NFT enquanto a tela dele estiver aberta. */
export function useNftSubscription(nftId: string | undefined) {
  useSubscription('nft', nftId)
}

/** Assina um pedido; é o que leva a tela de PENDING a CONFIRMED. */
export function useOrderSubscription(orderId: string | undefined) {
  useSubscription('order', orderId)
}
