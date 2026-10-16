import { z } from 'zod'

const ethAmount = z.string().regex(/^-?\d+(\.\d{1,18})?$/, 'valor ETH inválido')

export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: z.string(),
  editionLabel: z.string(),
  unitPrice: ethAmount,
  quantity: z.number().int().positive(),
  lineTotal: ethAmount,
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  promoCode: z.string().nullable(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
})
export type Cart = z.infer<typeof cartSchema>

export const EMPTY_CART: Cart = {
  id: 'empty',
  items: [],
  promoCode: null,
  subtotal: '0',
  discount: '0',
  networkFee: '0',
  total: '0',
}

export function cartItemCount(cart: Cart | undefined): number {
  return cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
}
