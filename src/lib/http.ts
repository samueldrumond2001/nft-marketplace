import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

import { getAccessToken, setAccessToken } from './session'

export const API_BASE_URL = '/api'

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // cookie httpOnly do refresh e do carrinho
  headers: { 'Content-Type': 'application/json' },
})

// A API é o MSW, que precisa estar de pé antes da primeira requisição. Em vez
// de segurar a renderização inteira até lá, a casca pinta na hora e só as
// chamadas esperam — o que tira ~100KB do caminho até o primeiro paint.
let apiReady: Promise<unknown> = Promise.resolve()

export function setApiReady(promise: Promise<unknown>): void {
  apiReady = promise
}

http.interceptors.request.use(async (config) => {
  await apiReady
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Single-flight: N requests com token vencido disparam 1 refresh, não N.
// Com rotação de refresh token os outros falhariam e derrubariam a sessão.
let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const { data } = await axios.post<{ accessToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        null,
        { withCredentials: true },
      )
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      setAccessToken(null)
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined

    // sem token nunca houve sessão: pedir refresh só geraria outro 401
    // `_retried` evita laço quando o refresh passa mas o recurso segue 401
    if (error.response?.status === 401 && config && !config._retried && getAccessToken()) {
      config._retried = true
      const token = await refreshAccessToken()
      if (token) {
        return http(config)
      }
    }

    return Promise.reject(error)
  },
)

/** Envelope de erro da API. */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string> | undefined

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  static from(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      const body = error.response?.data as ApiErrorBody | undefined
      return new ApiError(
        error.response?.status ?? 0,
        body?.error.code ?? 'NETWORK_ERROR',
        body?.error.message ?? 'Não foi possível completar a operação.',
        body?.error.fields,
      )
    }
    return new ApiError(0, 'UNKNOWN', 'Erro inesperado.')
  }
}
