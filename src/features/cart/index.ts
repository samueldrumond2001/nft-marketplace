// Superfície pública da feature. O resto é interno (regra no eslint.config.js).
export {
  CART_KEY,
  cartQuery,
  useAddToCart,
  useApplyPromo,
  useRemoveCartItem,
  useUpdateCartItem,
} from './api/cart'
export { CartSummary } from './components/CartSummary'
export { CartTable } from './components/CartTable'
export { EMPTY_CART, cartItemCount, cartItemSchema, cartSchema } from './model/cart'
export type { Cart, CartItem } from './model/cart'
