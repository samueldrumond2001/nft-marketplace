// Token em memória, fora do localStorage (XSS lê localStorage). O refresh
// fica em cookie httpOnly; aba nova recupera no primeiro 401.

let accessToken: string | null = null

type Listener = (token: string | null) => void
const listeners = new Set<Listener>()

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
  for (const listener of listeners) listener(token)
}

export function onAccessTokenChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
