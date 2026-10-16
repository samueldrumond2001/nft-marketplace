// Superfície pública da feature. O resto é interno (regra no eslint.config.js).
export {
  ME_KEY,
  WALLETS_KEY,
  meQuery,
  useChangePassword,
  useCreateWallet,
  useLogin,
  useLogout,
  useRegister,
  useUpdateProfile,
  useUpdateWallet,
  walletsQuery,
} from './api/auth'
export { AuthDialog, type AuthMode } from './components/AuthDialog'
export {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  userSchema,
  walletSchema,
} from './model/auth'
export type {
  ChangePasswordValues,
  LoginValues,
  RegisterValues,
  Session,
  User,
  Wallet,
} from './model/auth'
