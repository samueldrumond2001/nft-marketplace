import { useSyncExternalStore } from 'react'

/**
 * Lê uma media query como estado. `useSyncExternalStore` em vez de
 * `useState` + `useEffect` porque o primeiro render já devolve o valor certo:
 * com efeito haveria um quadro com o valor errado, e a gaveta de filtros
 * piscaria aberta no desktop.
 */
export function useMediaQuery(query: string) {
  const subscribe = (notify: () => void) => {
    const list = window.matchMedia(query)
    list.addEventListener('change', notify)
    return () => list.removeEventListener('change', notify)
  }

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // sem janela (teste em node) o desktop é o padrão
    () => true,
  )
}

/** `md` do Tailwind: acima disso a sidebar de filtros fica fixa na página. */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)')
}
