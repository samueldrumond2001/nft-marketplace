import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.email(),
  displayName: z.string(),
  ensName: z.string().nullable(),
  walletNickname: z.string().nullable(),
  // identificador da arte usada de avatar; null = iniciais do nome
  avatar: z.string().nullable(),
})
export type User = z.infer<typeof userSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'A senha tem no mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const sessionSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
})
export type Session = z.infer<typeof sessionSchema>

export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'A senha tem no mínimo 8 caracteres'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    username: z.string().min(3, 'Informe ao menos 3 caracteres'),
    email: z.email('E-mail inválido'),
    password: z.string().min(8, 'A senha tem no mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })
export type RegisterValues = z.infer<typeof registerSchema>

export const walletSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  address: z.string(),
  network: z.string(),
  profileName: z.string(),
  primary: z.boolean(),
})
export type Wallet = z.infer<typeof walletSchema>
