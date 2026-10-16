import type { User, Wallet } from '@/features/auth'
import type { Account } from '../data/accounts'
import { cloneSeedAccounts } from '../data/accounts'
import type { Scenario } from '../scenarios'
import type { MockResult } from './nfts'

const STORAGE_KEY = 'kurio:mock-session'

interface State {
  accounts: Account[]
  currentId: string | null
}

function load(): State {
  try {
    const raw = globalThis.sessionStorage?.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* ignora */
  }
  return { accounts: cloneSeedAccounts(), currentId: null }
}

const state: State = load()

function persist(): void {
  try {
    globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignora */
  }
}

/** Volta às duas contas de fábrica, sem sessão. Usado pelo reset de cenário. */
export function resetAccounts(): void {
  state.accounts = cloneSeedAccounts()
  state.currentId = null
  persist()
}

function token(): string {
  return `mock.${Date.now().toString(36)}`
}

const unauthenticated: MockResult = {
  status: 401,
  body: { error: { code: 'UNAUTHENTICATED', message: 'Faça login.' } },
}

function account(): Account | null {
  return state.accounts.find((item) => item.id === state.currentId) ?? null
}

/** O id da conta logada, ou null. O carrinho usa isto para separar os donos. */
export function currentAccountId(): string | null {
  return state.currentId
}

/** O que sai na API: a senha e as listas internas ficam no servidor. */
function publicUser(item: Account): User {
  return {
    id: item.id,
    username: item.username,
    email: item.email,
    displayName: item.displayName,
    ensName: item.ensName,
    walletNickname: item.walletNickname,
    avatar: item.avatar,
  }
}

export function login(body: { email?: unknown; password?: unknown }): MockResult {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const found = state.accounts.find((item) => item.email === email && item.password === password)
  if (!found) {
    return {
      status: 401,
      body: { error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' } },
    }
  }

  state.currentId = found.id
  persist()
  return { status: 200, body: { user: publicUser(found), accessToken: token() } }
}

export function register(body: {
  email?: unknown
  password?: unknown
  username?: unknown
}): MockResult {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email.includes('@') || username.length < 3 || password.length < 8) {
    return {
      status: 422,
      body: { error: { code: 'INVALID_PAYLOAD', message: 'Dados de cadastro inválidos.' } },
    }
  }

  // 409 e não 422: o payload está correto, o conflito é com o estado do
  // servidor. A interface precisa distinguir os dois para escolher a mensagem.
  if (state.accounts.some((item) => item.email === email)) {
    return {
      status: 409,
      body: {
        error: {
          code: 'EMAIL_TAKEN',
          message: 'Já existe uma conta com este e-mail.',
          fields: { email: 'E-mail já cadastrado' },
        },
      },
    }
  }

  const created: Account = {
    id: `user-${state.accounts.length + 1}`,
    email,
    password,
    username,
    displayName: username,
    ensName: null,
    walletNickname: null,
    avatar: null,
    wallets: [],
    favorites: [],
  }

  state.accounts.push(created)
  state.currentId = created.id
  persist()
  return { status: 201, body: { user: publicUser(created), accessToken: token() } }
}

export function logout(): MockResult {
  state.currentId = null
  persist()
  return { status: 200, body: { ok: true } }
}

export function refresh(): MockResult {
  if (!state.currentId) {
    return { status: 401, body: { error: { code: 'NO_SESSION', message: 'Sessão expirada.' } } }
  }
  return { status: 200, body: { accessToken: token() } }
}

// Sem sessão devolve 204, não 401: visitante anônimo é um estado normal do
// site, e 401 marcaria toda visita deslogada como erro no console. O 401 fica
// para o que é de fato uma falha de credencial — token inválido ou expirado.
export function me(scenario: Scenario): MockResult {
  if (scenario === 'unauthorized') {
    return { status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'Faça login.' } } }
  }
  const current = account()
  if (!current) return { status: 204, body: {} }
  return { status: 200, body: publicUser(current) }
}

export function updateProfile(body: Record<string, unknown>): MockResult {
  const current = account()
  if (!current) return unauthenticated

  const text = (key: string, fallback: string) =>
    typeof body[key] === 'string' && body[key].length > 0 ? body[key] : fallback

  current.displayName = text('displayName', current.displayName)
  current.username = text('username', current.username)
  current.email = text('email', current.email).toLowerCase()
  if (typeof body.ensName === 'string') current.ensName = body.ensName
  if (typeof body.walletNickname === 'string') current.walletNickname = body.walletNickname
  if (typeof body.avatar === 'string') current.avatar = body.avatar
  if (body.avatar === null) current.avatar = null

  persist()
  return { status: 200, body: publicUser(current) }
}

export function changePassword(body: Record<string, unknown>): MockResult {
  const current = account()
  if (!current) return unauthenticated

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (currentPassword !== current.password) {
    return {
      status: 422,
      body: {
        error: {
          code: 'WRONG_PASSWORD',
          message: 'Senha atual incorreta.',
          fields: { currentPassword: 'Senha atual incorreta' },
        },
      },
    }
  }

  if (newPassword.length < 8) {
    return {
      status: 422,
      body: {
        error: {
          code: 'WEAK_PASSWORD',
          message: 'A nova senha tem no mínimo 8 caracteres.',
          fields: { newPassword: 'Mínimo de 8 caracteres' },
        },
      },
    }
  }

  current.password = newPassword
  persist()
  return { status: 200, body: { ok: true } }
}

export function listWallets(): MockResult {
  const current = account()
  if (!current) return unauthenticated
  return { status: 200, body: current.wallets }
}

export function createWallet(body: Record<string, unknown>): MockResult {
  const current = account()
  if (!current) return unauthenticated

  const text = (key: string) => (typeof body[key] === 'string' ? body[key] : '')
  const wallet: Wallet = {
    id: `wallet-${current.id}-${current.wallets.length + 1}`,
    nickname: text('nickname'),
    address: text('address'),
    network: text('network'),
    profileName: text('profileName'),
    primary: current.wallets.length === 0,
  }

  current.wallets.push(wallet)
  persist()
  return { status: 201, body: wallet }
}

export function updateWallet(walletId: string, body: Record<string, unknown>): MockResult {
  const current = account()
  if (!current) return unauthenticated

  const wallet = current.wallets.find((item) => item.id === walletId)
  if (!wallet) {
    return {
      status: 404,
      body: { error: { code: 'WALLET_NOT_FOUND', message: 'Carteira não encontrada.' } },
    }
  }

  for (const key of ['nickname', 'address', 'network', 'profileName'] as const) {
    if (typeof body[key] === 'string' && body[key].length > 0) wallet[key] = body[key]
  }

  // só uma principal: marcar uma desmarca a anterior
  if (body.primary === true) {
    for (const item of current.wallets) item.primary = item.id === walletId
  }

  persist()
  return { status: 200, body: wallet }
}

export function listFavorites(): MockResult {
  const current = account()
  if (!current) return unauthenticated
  return { status: 200, body: { nftIds: current.favorites } }
}

const favoriteFailure: MockResult = {
  status: 500,
  body: { error: { code: 'FAVORITE_FAILED', message: 'Não foi possível salvar o favorito.' } },
}

export function addFavorite(nftId: string, scenario: Scenario): MockResult {
  const current = account()
  if (!current) return unauthenticated
  if (scenario === 'favorite-error') return favoriteFailure

  // PUT é idempotente: favoritar duas vezes dá o mesmo resultado
  if (!current.favorites.includes(nftId)) current.favorites.push(nftId)
  persist()
  return { status: 200, body: { nftIds: current.favorites } }
}

export function removeFavorite(nftId: string, scenario: Scenario): MockResult {
  const current = account()
  if (!current) return unauthenticated
  if (scenario === 'favorite-error') return favoriteFailure

  current.favorites = current.favorites.filter((id) => id !== nftId)
  persist()
  return { status: 200, body: { nftIds: current.favorites } }
}
