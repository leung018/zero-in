import { describe, expect, it } from 'vitest'
import { formatNumber } from './util'

describe('formatNumber', () => {
  it('should format number', () => {
    expect(formatNumber(0, 2)).toBe('00')
    expect(formatNumber(9)).toBe('09') // default minDigits is 2
    expect(formatNumber(10, 2)).toBe('10')
    expect(formatNumber(59, 2)).toBe('59')

    expect(formatNumber(0, 1)).toBe('0')
    expect(formatNumber(1, 3)).toBe('001')
  })
})
