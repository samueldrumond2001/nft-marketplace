import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { CART_KEY } from '@/features/cart'
import { clearCheckoutAttempt, getOrCreateCheckoutAttempt } from '@/lib/idempotency'
import { ApiError, http } from '@/lib/http'
import { STALE } from '@/lib/query-client'
import type { CheckoutForm, Order, Quote } from '../model/checkout'
import { orderSchema, quoteSchema } from '../model/checkout'

function wrap(error: unknown): never {
  if (error instanceof z.ZodError) throw error
  throw ApiError.from(error)
}

export function useQuote() {
  return useMutation({
    mutationFn: async (): Promise<Quote> => {
      try {
        const { data } = await http.post<unknown>('/checkout/quote')
        return quoteSchema.parse(data)
      } catch (error) {
        wrap(error)
      }
    },
  })
}

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ['order', id] as const,
    queryFn: async (): Promise<Order> => {
      try {
        const { data } = await http.get<unknown>(`/orders/${id}`)
        return orderSchema.parse(data)
      } catch (error) {
        wrap(error)
      }
    },
    staleTime: STALE.money,
    // Rede de proteção enquanto o pedido não fecha. Na etapa de tempo real
    // quem avisa é o socket; isto cobre o caso dele cair.
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 2000 : false),
  })

export function usePlaceOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { quoteId: string; form: CheckoutForm }): Promise<Order> => {
      const attempt = getOrCreateCheckoutAttempt(vars.quoteId)

      try {
        const { data } = await http.post<unknown>(
          '/orders',
          { quoteId: vars.quoteId, ...vars.form },
          { headers: { 'Idempotency-Key': attempt.idempotencyKey } },
        )
        return orderSchema.parse(data)
      } catch (error) {
        wrap(error)
      }
    },
    onSuccess: (order) => {
      queryClient.setQueryData(['order', order.id], order)
      void queryClient.invalidateQueries({ queryKey: CART_KEY })
      // a chave só morre quando o pedido não pode mais ser retentado
      if (order.status !== 'PENDING') clearCheckoutAttempt()
    },
  })
}
