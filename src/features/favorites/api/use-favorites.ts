import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { meQuery } from '@/features/auth'
import { favoritesQuery, useToggleFavorite } from './favorites'

/**
 * Junta sessão, lista e mutação num lugar só porque as três sempre aparecem
 * juntas: o coração precisa saber se está marcado, e quem não entrou não tem
 * onde guardar o favorito — aí o clique abre o login em vez de tomar 401.
 */
export function useFavorites() {
  const navigate = useNavigate()
  const { data: user } = useQuery(meQuery)
  const { data: favorites } = useQuery(favoritesQuery(!!user))
  const toggle = useToggleFavorite()

  return {
    isFavorite: (nftId: string) => favorites?.includes(nftId) ?? false,
    pending: toggle.isPending,
    toggle: (nftId: string) => {
      if (!user) {
        void navigate({ to: '.', search: (prev) => ({ ...prev, auth: 'login' }) })
        return
      }
      toggle.mutate({ nftId, favorite: !favorites?.includes(nftId) })
    },
  }
}
