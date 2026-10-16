import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Container } from '@/components/layout/Container'
import { cartQuery } from '@/features/cart'
import {
  CheckoutForm,
  OrderSummary,
  usePlaceOrder,
  useQuote,
  type CheckoutValues,
} from '@/features/checkout'
import { ApiError } from '@/lib/http'

const FORM_ID = 'checkout-form'

export const Route = createFileRoute('/pagamento')({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery),
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const { data: cart } = useQuery(cartQuery)
  const quote = useQuote()
  const placeOrder = usePlaceOrder()
  const [wallet, setWallet] = useState('coinbase')

  // O orçamento é guardado entre tentativas. A chave de idempotência deriva do
  // quoteId, então pedir um orçamento novo a cada clique geraria uma chave
  // nova — e o retry depois de um 5xx poderia cobrar duas vezes, que é
  // exatamente o que a chave existe para impedir. Só um 409 descarta o
  // orçamento, porque aí o preço realmente mudou.
  const pendingQuoteId = useRef<string | null>(null)

  if (!cart) return null

  const placeWith = (quoteId: string, values: CheckoutValues) => {
    placeOrder.mutate(
      { quoteId, form: { ...values, walletType: wallet as never } },
      {
        onSuccess: (order) =>
          void navigate({ to: '/pedido/$orderId', params: { orderId: order.id } }),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            pendingQuoteId.current = null
          }
        },
      },
    )
  }

  const submit = (values: CheckoutValues) => {
    if (pendingQuoteId.current) {
      placeWith(pendingQuoteId.current, values)
      return
    }

    quote.mutate(undefined, {
      onSuccess: (fresh) => {
        pendingQuoteId.current = fresh.quoteId
        placeWith(fresh.quoteId, values)
      },
    })
  }

  const failure = placeOrder.error ?? quote.error
  const message = failure instanceof ApiError ? failure.message : undefined
  const submitting = quote.isPending || placeOrder.isPending

  return (
    <Container className="pt-6 pb-20">
      <Breadcrumb
        items={[
          { label: 'Início', to: '/' },
          { label: 'Mercado', to: '/mercado' },
          { label: 'Pagamento' },
        ]}
      />

      {cart.items.length === 0 ? (
        <p className="text-text-secondary py-24 text-center text-sm">
          Não há itens para pagar. Volte ao mercado e escolha um NFT.
        </p>
      ) : (
        <div className="mt-5 grid gap-16 lg:grid-cols-[1fr_minmax(0,406px)]">
          <CheckoutForm formId={FORM_ID} onSubmit={submit} />
          <OrderSummary
            cart={cart}
            formId={FORM_ID}
            wallet={wallet}
            onWalletChange={setWallet}
            submitting={submitting}
            error={message}
          />
        </div>
      )}
    </Container>
  )
}
