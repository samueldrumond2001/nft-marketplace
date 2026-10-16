// Um conjunto de handlers; o cenário muda o comportamento.
// `?scenario=` na URL, ou window.__scenario nos testes.

export const SCENARIOS = [
  'happy',
  'empty',
  'slow',
  'price-changed',
  'sold-out',
  'payment-failed',
  'network-error',
  'unauthorized',
  'promo-invalid',
  'offline',
  'socket-down',
  'favorite-error',
  'session-expired',
  'wallet-refused',
] as const

export type Scenario = (typeof SCENARIOS)[number]

declare global {
  interface Window {
    __scenario?: Scenario
  }
}

function isScenario(value: string | null | undefined): value is Scenario {
  return !!value && (SCENARIOS as readonly string[]).includes(value)
}

export function currentScenario(): Scenario {
  if (typeof window === 'undefined') return 'happy'

  if (isScenario(window.__scenario)) return window.__scenario

  const fromUrl = new URLSearchParams(window.location.search).get('scenario')
  return isScenario(fromUrl) ? fromUrl : 'happy'
}

/**
 * Latência variável de propósito. Com um número fixo, corrida entre respostas
 * nunca acontece e o descarte de resposta obsoleta passava sem ser exercitado.
 * `slow` é o extremo, para ver os esqueletos sem piscar.
 */
export function scenarioDelay(): number {
  const scenario = currentScenario()
  if (scenario === 'slow') return 2600 + Math.random() * 1400
  return 60 + Math.random() * 260
}

/** `offline`: a rede não responde, como quando o aparelho perde o sinal. */
export function isOffline(): boolean {
  return currentScenario() === 'offline'
}

/** `socket-down`: só o tempo real cai; o REST continua de pé. */
export function isSocketDown(): boolean {
  return currentScenario() === 'socket-down' || isOffline()
}
