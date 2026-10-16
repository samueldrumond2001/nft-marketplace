import { describe, expect, it } from 'vitest'

import { formatEth, formatEthLabel, multiplyWei, parseEth, sumWei } from '@/lib/eth'

describe('parseEth', () => {
  it('converte decimal para wei', () => {
    expect(parseEth('1')).toBe(10n ** 18n)
    expect(parseEth('1.19')).toBe(1_190_000_000_000_000_000n)
    expect(parseEth('0.016')).toBe(16_000_000_000_000_000n)
    expect(parseEth(0.39)).toBe(390_000_000_000_000_000n)
  })

  it('recusa entrada inválida', () => {
    expect(() => parseEth('abc')).toThrow(/inválido/)
    expect(() => parseEth('1.2.3')).toThrow(/inválido/)
    expect(() => parseEth('')).toThrow(/inválido/)
  })

  it('recusa mais casas decimais do que o ETH suporta', () => {
    expect(() => parseEth(`0.${'1'.repeat(19)}`)).toThrow(/18 casas/)
  })
})

describe('formatEth', () => {
  it('mantém no mínimo duas casas e corta zeros sobrando', () => {
    expect(formatEth(parseEth('1.19'))).toBe('1.19')
    expect(formatEth(parseEth('1'))).toBe('1.00')
    expect(formatEth(parseEth('26.846'))).toBe('26.846')
    expect(formatEth(parseEth('0.016'))).toBe('0.016')
  })

  it('preserva o sinal', () => {
    expect(formatEth(parseEth('-0.5'))).toBe('-0.50')
  })

  it('rotula com a unidade', () => {
    expect(formatEthLabel(parseEth('8.936'))).toBe('8.936 ETH')
  })
})

describe('soma e multiplicação', () => {
  // o caso que motiva usar bigint: em float, 1.19 + 1.39 dá 2.5799999999999996
  it('soma sem erro de ponto flutuante', () => {
    const total = sumWei([parseEth('1.19'), parseEth('1.39')])
    expect(formatEth(total)).toBe('2.58')
  })

  it('reproduz o total do carrinho do design', () => {
    // 1.19×2 + 1.39×6 + 1.79×9 = 2.38 + 8.34 + 16.11 = 26.83
    const subtotal = sumWei([
      multiplyWei(parseEth('1.19'), 2),
      multiplyWei(parseEth('1.39'), 6),
      multiplyWei(parseEth('1.79'), 9),
    ])
    expect(formatEth(subtotal)).toBe('26.83')
    expect(formatEth(subtotal + parseEth('0.016'))).toBe('26.846')
  })

  it('recusa quantidade não inteira', () => {
    expect(() => multiplyWei(parseEth('1'), 1.5)).toThrow(/inteiro/)
  })
})
