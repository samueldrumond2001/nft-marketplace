// Valor em wei (bigint). Em float, 1.19 + 1.39 = 2.5799999999999996.

const WEI_PER_ETH = 10n ** 18n
const DECIMALS = 18

/** Converte "1.19" (ou 1.19) para wei. Lança em entrada inválida. */
export function parseEth(value: string | number): bigint {
  const raw = typeof value === 'number' ? value.toString() : value.trim()

  if (!/^-?\d*\.?\d+$/.test(raw)) {
    throw new Error(`valor ETH inválido: ${JSON.stringify(value)}`)
  }

  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const [whole = '0', fraction = ''] = unsigned.split('.')

  if (fraction.length > DECIMALS) {
    throw new Error(`ETH suporta ${DECIMALS} casas decimais, recebido ${fraction.length}`)
  }

  const padded = fraction.padEnd(DECIMALS, '0')
  const wei = BigInt(whole) * WEI_PER_ETH + BigInt(padded)

  return negative ? -wei : wei
}

/** Corta zeros à direita, mínimo 2 casas: 1.19, 26.846, 0.016. */
export function formatEth(wei: bigint, { minDecimals = 2, maxDecimals = 6 } = {}): string {
  const negative = wei < 0n
  const abs = negative ? -wei : wei

  const whole = abs / WEI_PER_ETH
  const fraction = (abs % WEI_PER_ETH).toString().padStart(DECIMALS, '0')

  let visible = fraction.slice(0, maxDecimals)
  while (visible.length > minDecimals && visible.endsWith('0')) {
    visible = visible.slice(0, -1)
  }

  const sign = negative ? '-' : ''
  return visible.length > 0 ? `${sign}${whole}.${visible}` : `${sign}${whole}`
}

/** `1.19 ETH` */
export function formatEthLabel(wei: bigint, options?: Parameters<typeof formatEth>[1]): string {
  return `${formatEth(wei, options)} ETH`
}

export function sumWei(values: readonly bigint[]): bigint {
  return values.reduce<bigint>((total, value) => total + value, 0n)
}

export function multiplyWei(wei: bigint, quantity: number): bigint {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`quantidade deve ser inteiro não negativo, recebido ${quantity}`)
  }
  return wei * BigInt(quantity)
}
