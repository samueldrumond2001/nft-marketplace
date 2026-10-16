import type { Wallet } from '@/features/auth'

/**
 * Duas contas, não uma. Com um usuário só não dá para demonstrar isolamento:
 * favoritos, carteiras e carrinho de um não podem aparecer para o outro, e
 * isso só se prova trocando de sessão.
 *
 * As credenciais estão no README; são fictícias e o mock é o único "backend".
 */
export interface Account {
  id: string
  email: string
  password: string
  username: string
  displayName: string
  ensName: string | null
  walletNickname: string | null
  avatar: string | null
  wallets: Wallet[]
  favorites: string[]
}

export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'user-ana',
    email: 'ana@kurio.dev',
    password: 'kurio1234',
    username: 'ana.collects',
    displayName: 'Ana Ribeiro',
    ensName: 'ana.eth',
    walletNickname: 'Principal',
    avatar: 'emerald-ape',
    wallets: [
      {
        id: 'wallet-ana-1',
        nickname: 'Principal',
        address: '0xA11CE0000000000000000000000000000000CAFE',
        network: 'ethereum',
        profileName: 'Ana Ribeiro',
        primary: true,
      },
    ],
    favorites: ['emerald-ape-042'],
  },
  {
    id: 'user-bruno',
    email: 'bruno@kurio.dev',
    password: 'kurio1234',
    username: 'bruno.mint',
    displayName: 'Bruno Alencar',
    ensName: null,
    walletNickname: null,
    avatar: null,
    wallets: [],
    favorites: [],
  },
]

export function cloneSeedAccounts(): Account[] {
  return SEED_ACCOUNTS.map((account) => ({
    ...account,
    wallets: account.wallets.map((wallet) => ({ ...wallet })),
    favorites: [...account.favorites],
  }))
}
