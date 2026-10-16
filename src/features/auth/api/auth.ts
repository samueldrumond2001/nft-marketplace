import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { ApiError, http } from '@/lib/http'
import { STALE } from '@/lib/query-client'
import { setAccessToken } from '@/lib/session'
import { disconnectSocket } from '@/lib/socket'
import type {
  ChangePasswordValues,
  LoginValues,
  RegisterValues,
  Session,
  User,
  Wallet,
} from '../model/auth'
import { sessionSchema, userSchema, walletSchema } from '../model/auth'

export const ME_KEY = ['me'] as const
export const WALLETS_KEY = ['wallets'] as const

function wrap(error: unknown): never {
  if (error instanceof z.ZodError) throw error
  throw ApiError.from(error)
}

export const meQuery = queryOptions({
  queryKey: ME_KEY,
  queryFn: async (): Promise<User | null> => {
    try {
      const response = await http.get<unknown>('/me')
      // 204 = ninguém logado; 401 = credencial inválida, tratado abaixo
      if (response.status === 204) return null
      return userSchema.parse(response.data)
    } catch (error) {
      if (error instanceof z.ZodError) throw error
      const api = ApiError.from(error)
      if (api.status === 401) return null
      throw api
    }
  },
  staleTime: STALE.session,
  retry: false,
})

function useSessionMutation<TVars>(url: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: TVars): Promise<Session> => {
      try {
        const { data } = await http.post<unknown>(url, values)
        return sessionSchema.parse(data)
      } catch (error) {
        wrap(error)
      }
    },
    onSuccess: (session) => {
      setAccessToken(session.accessToken)
      queryClient.setQueryData(ME_KEY, session.user)
    },
  })
}

export const useLogin = () => useSessionMutation<LoginValues>('/auth/login')
export const useRegister = () => useSessionMutation<RegisterValues>('/auth/register')

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await http.post('/auth/logout')
    },
    onSuccess: async () => {
      setAccessToken(null)
      // derruba o socket: as assinaturas eram da sessão que acabou, e evento
      // atrasado dela não pode alterar dado de quem entrar depois
      await disconnectSocket()
      // resetQueries e não clear(): clear() esvazia o cache mas não refaz as
      // queries montadas, então o header continuava mostrando o usuário que
      // acabou de sair. resetQueries descarta o dado e refaz o que está na tela.
      await queryClient.resetQueries()
    },
  })
}

export const walletsQuery = queryOptions({
  queryKey: WALLETS_KEY,
  queryFn: async (): Promise<Wallet[]> => {
    try {
      const { data } = await http.get<unknown>('/wallets')
      return z.array(walletSchema).parse(data)
    } catch (error) {
      wrap(error)
    }
  },
  staleTime: STALE.session,
})

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Partial<User>): Promise<User> => {
      try {
        const { data } = await http.patch<unknown>('/me', values)
        return userSchema.parse(data)
      } catch (error) {
        wrap(error)
      }
    },
    onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
  })
}

export function useCreateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Omit<Wallet, 'id' | 'primary'>): Promise<Wallet> => {
      try {
        const { data } = await http.post<unknown>('/wallets', values)
        return walletSchema.parse(data)
      } catch (error) {
        wrap(error)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WALLETS_KEY }),
  })
}

export function useUpdateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Wallet> & { id: string }): Promise<Wallet> => {
      try {
        const { data } = await http.patch<unknown>(`/wallets/${id}`, values)
        return walletSchema.parse(data)
      } catch (error) {
        wrap(error)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WALLETS_KEY }),
  })
}

/*
 * A senha nova não entra em nenhum cache: a resposta é só um ok. Guardar o
 * valor digitado em algum estado seria mantê-lo em memória sem motivo.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (values: ChangePasswordValues): Promise<void> => {
      try {
        await http.post('/me/password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      } catch (error) {
        wrap(error)
      }
    },
  })
}
