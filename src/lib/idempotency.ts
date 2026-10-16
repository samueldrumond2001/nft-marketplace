// Uma chave por tentativa de compra, no sessionStorage para sobreviver a
// reload. Clique duplo, F5 no meio do POST e retry mandam a mesma chave.

const STORAGE_KEY = 'kurio:checkout-attempt'

export interface CheckoutAttempt {
  idempotencyKey: string
  quoteId: string
  createdAt: number
}

function readStorage(): CheckoutAttempt | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CheckoutAttempt>
    if (!parsed.idempotencyKey || !parsed.quoteId) return null
    return parsed as CheckoutAttempt
  } catch {
    return null // storage bloqueado
  }
}

function writeStorage(attempt: CheckoutAttempt): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
  } catch {
    // sem storage ainda funciona, só perde a proteção contra reload
  }
}

// Orçamento novo = cobrança nova = chave nova, senão o servidor devolve o
// pedido antigo com o valor velho.
export function getOrCreateCheckoutAttempt(quoteId: string): CheckoutAttempt {
  const existing = readStorage()
  if (existing && existing.quoteId === quoteId) {
    return existing
  }

  const attempt: CheckoutAttempt = {
    idempotencyKey: crypto.randomUUID(),
    quoteId,
    createdAt: Date.now(),
  }
  writeStorage(attempt)
  return attempt
}

/** Chamar quando o pedido chega a CONFIRMED ou FAILED. */
export function clearCheckoutAttempt(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignora */
  }
}
