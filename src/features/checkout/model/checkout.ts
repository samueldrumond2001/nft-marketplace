import { z } from 'zod'

import { cartItemSchema } from '@/features/cart'

const ethAmount = z.string().regex(/^-?\d+(\.\d{1,18})?$/, 'valor ETH inválido')

export const quoteSchema = z.object({
  quoteId: z.string(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  expiresAt: z.string(),
})
export type Quote = z.infer<typeof quoteSchema>

export const ORDER_STATUS = ['PENDING', 'CONFIRMED', 'FAILED'] as const
export const orderStatusSchema = z.enum(ORDER_STATUS)
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  txHash: z.string().nullable(),
  walletType: z.string(),
  items: z.array(cartItemSchema),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  createdAt: z.string(),
  failureReason: z.string().nullable(),
})
export type Order = z.infer<typeof orderSchema>

export const NETWORKS = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
] as const

export const WALLET_TYPES = [
  { value: 'metamask', label: 'MetaMask' },
  { value: 'walletconnect', label: 'WalletConnect' },
  { value: 'coinbase', label: 'Coinbase Wallet' },
] as const

// `0x` seguido de 40 hex é o formato de endereço da Ethereum. Validar aqui
// evita mandar ao servidor um endereço que nunca receberia o NFT.
const WALLET_ADDRESS = /^0x[a-fA-F0-9]{40}$/

export const checkoutFormSchema = z.object({
  displayName: z.string().min(2, 'Informe ao menos 2 caracteres'),
  username: z.string().min(2, 'Informe ao menos 2 caracteres'),
  network: z.enum(['ethereum', 'polygon', 'solana'], { message: 'Selecione uma rede' }),
  profileName: z.string().min(2, 'Informe ao menos 2 caracteres'),
  walletAddress: z.string().regex(WALLET_ADDRESS, 'Endereço deve começar com 0x e ter 40 dígitos'),
  secondaryWallet: z.string().optional(),
  walletType: z.enum(['metamask', 'walletconnect', 'coinbase'], {
    message: 'Selecione uma carteira',
  }),
  referralCode: z.string().min(1, 'Informe o código de indicação'),
  email: z.email('E-mail inválido'),
  ensName: z.string().min(1, 'Informe o nome ENS'),
  note: z.string().optional(),
})
export type CheckoutForm = z.infer<typeof checkoutFormSchema>
