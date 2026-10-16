import type { Scenario } from '../scenarios'
import type { MockResult } from './nfts'

/*
 * Conexão de carteira simulada. Numa aplicação real quem responde é a
 * extensão (MetaMask e afins), e as três respostas possíveis são sempre as
 * mesmas: conectou, o usuário recusou, ou a carteira desconectou depois. O
 * mock reproduz as três para que a interface tenha o que tratar.
 */
interface WalletSession {
  address: string
  walletType: string
}

const ADDRESSES: Record<string, string> = {
  metamask: '0x4F2A91C8B6E0D7135A8C9E4B2F7D6A1038E5C9B4',
  coinbase: '0x91B7E3D2A4C6F8019B5D7E2A3C4F6089D1E7B5A2',
  walletconnect: '0x7C3E5A9014B2D6F8E7A1C4B903D5F826E4A7C091',
}

let session: WalletSession | null = null

export function getWallet(): MockResult {
  return { status: 200, body: { wallet: session } }
}

export function connectWallet(body: Record<string, unknown>, scenario: Scenario): MockResult {
  const walletType = typeof body.walletType === 'string' ? body.walletType : 'metamask'

  // recusa é a resposta mais comum de uma carteira de verdade: a pessoa abre
  // a extensão e clica em cancelar
  if (scenario === 'wallet-refused') {
    return {
      status: 403,
      body: {
        error: {
          code: 'WALLET_REFUSED',
          message: 'A conexão foi recusada na carteira.',
        },
      },
    }
  }

  session = { address: ADDRESSES[walletType] ?? ADDRESSES.metamask!, walletType }
  return { status: 200, body: { wallet: session } }
}

export function disconnectWallet(): MockResult {
  session = null
  return { status: 200, body: { wallet: null } }
}

export function resetWallet(): void {
  session = null
}
