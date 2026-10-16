import { useEffect, useState } from 'react'

import { connectSocket } from '@/lib/socket'

export type ConnectionState = 'connecting' | 'online' | 'offline'

/**
 * Quanto tempo esperar pelo primeiro `connect` antes de admitir que o tempo
 * real não vai subir. O `connect_error` do socket.io só aparece quando o
 * outro lado responde alguma coisa; servidor fora do ar costuma deixar a
 * conexão pendurada, e aí ninguém avisa nada.
 */
const CONNECT_GRACE_MS = 4000

/**
 * Estado da conexão em tempo real, para a interface poder dizer que o que
 * está na tela pode estar velho. Enquanto o socket está fora, nenhum evento
 * chega: sem aviso, a página parece atualizada e não está.
 */
export function useConnectionStatus(): ConnectionState {
  const [state, setState] = useState<ConnectionState>('connecting')

  useEffect(() => {
    let disposed = false
    let detach = () => {}

    void connectSocket().then((socket) => {
      if (disposed) return

      setState(socket.connected ? 'online' : 'connecting')

      const grace = setTimeout(() => {
        if (!socket.connected) setState('offline')
      }, CONNECT_GRACE_MS)

      const online = () => {
        clearTimeout(grace)
        setState('online')
      }
      const offline = () => setState('offline')

      socket.on('connect', online)
      socket.on('disconnect', offline)
      socket.on('connect_error', offline)

      detach = () => {
        clearTimeout(grace)
        socket.off('connect', online)
        socket.off('disconnect', offline)
        socket.off('connect_error', offline)
      }
    })

    return () => {
      disposed = true
      detach()
    }
  }, [])

  return state
}
