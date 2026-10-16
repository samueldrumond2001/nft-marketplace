import type { Socket } from 'socket.io-client'

// Origem fixa e fictícia: quem responde é o mock, e assim o endereço não muda
// entre dev (5174) e preview (4174).
export const SOCKET_URL = 'http://kurio.local'

let pending: Promise<Socket> | null = null

/**
 * O socket.io-client é importado sob demanda, não no topo do módulo.
 *
 * O engine.io-client guarda `globalThis.WebSocket` na hora em que é avaliado.
 * Importado estaticamente, ele pega o WebSocket nativo antes de o MSW trocar o
 * global pelo dele — e aí nenhum evento mockado chega. Carregando depois que o
 * worker subiu, ele pega o certo.
 */
export function connectSocket(): Promise<Socket> {
  pending ??= import('socket.io-client').then(({ io }) =>
    io(SOCKET_URL, {
      // só websocket: o polling faria requisições HTTP que o mock de
      // WebSocket não intercepta
      transports: ['websocket'],
      reconnectionDelay: 500,
      // sem teto ele tenta para sempre e enche o console; onde não existe
      // servidor (worker do MSW que não registrou) isso vira centenas de erros
      reconnectionAttempts: 5,
    }),
  )
  return pending
}

export async function disconnectSocket(): Promise<void> {
  const socket = await pending
  socket?.disconnect()
  pending = null
}
