import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { ApiError, http } from '@/lib/http'
import { STALE } from '@/lib/query-client'
import { formatEth, multiplyWei, parseEth, sumWei } from '@/lib/eth'
import type { Cart } from '../model/cart'
import { cartSchema } from '../model/cart'

export const CART_KEY = ['cart'] as const

async function request(method: 'get' | 'post' | 'patch' | 'delete', url: string, body?: unknown) {
  try {
    const { data } = await http.request<unknown>({ method, url, data: body })
    return cartSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) throw error
    throw ApiError.from(error)
  }
}

export const cartQuery = queryOptions({
  queryKey: CART_KEY,
  queryFn: () => request('get', '/cart'),
  staleTime: STALE.money,
})

// Recalcula o carrinho no cliente para a atualização otimista. É uma previsão,
// não a verdade: o servidor responde com o carrinho real e sobrescreve.
function recalculate(cart: Cart, items: Cart['items']): Cart {
  const subtotal = sumWei(items.map((item) => parseEth(item.lineTotal)))
  const discount = parseEth(cart.discount)
  const fee = items.length > 0 ? parseEth(cart.networkFee) : 0n

  return {
    ...cart,
    items,
    subtotal: formatEth(subtotal),
    total: formatEth(subtotal - discount + fee),
  }
}

/**
 * Mutations otimistas seguem sempre o mesmo roteiro: cancelar o que está em
 * voo, guardar o carrinho atual, escrever o novo, restaurar se der erro e
 * invalidar no fim.
 */
function useCartMutation<TVars>(
  send: (vars: TVars) => Promise<Cart>,
  predict?: (cart: Cart, vars: TVars) => Cart,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: send,
    onMutate: async (vars: TVars) => {
      if (!predict) return { previous: undefined }
      await queryClient.cancelQueries({ queryKey: CART_KEY })
      const previous = queryClient.getQueryData<Cart>(CART_KEY)
      if (previous) queryClient.setQueryData(CART_KEY, predict(previous, vars))
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(CART_KEY, context.previous)
    },
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  })
}

export function useAddToCart() {
  return useCartMutation((vars: { nftId: string; editionLabel: string; quantity: number }) =>
    request('post', '/cart/items', vars),
  )
}

export function useUpdateCartItem() {
  return useCartMutation(
    (vars: { itemId: string; quantity: number }) =>
      request('patch', `/cart/items/${vars.itemId}`, { quantity: vars.quantity }),
    (cart, vars) =>
      recalculate(
        cart,
        cart.items.map((item) =>
          item.id === vars.itemId
            ? {
                ...item,
                quantity: vars.quantity,
                lineTotal: formatEth(multiplyWei(parseEth(item.unitPrice), vars.quantity)),
              }
            : item,
        ),
      ),
  )
}

export function useRemoveCartItem() {
  return useCartMutation(
    (vars: { itemId: string }) => request('delete', `/cart/items/${vars.itemId}`),
    (cart, vars) =>
      recalculate(
        cart,
        cart.items.filter((item) => item.id !== vars.itemId),
      ),
  )
}

export function useApplyPromo() {
  // sem previsão: só o servidor sabe se o código vale e quanto desconta
  return useCartMutation((vars: { code: string }) => request('post', '/cart/promo', vars))
}
