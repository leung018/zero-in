import { formatNumber, getNumberWithOrdinal } from './format'

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

describe('getNumberWithOrdinal', () => {
  it('should return number with ordinal', () => {
    expect(getNumberWithOrdinal(1)).toBe('1st')
    expect(getNumberWithOrdinal(2)).toBe('2nd')
    expect(getNumberWithOrdinal(3)).toBe('3rd')
    expect(getNumberWithOrdinal(4)).toBe('4th')
    expect(getNumberWithOrdinal(10)).toBe('10th')

    expect(getNumberWithOrdinal(11)).toBe('11th')
    expect(getNumberWithOrdinal(12)).toBe('12th')
    expect(getNumberWithOrdinal(13)).toBe('13th')
    expect(getNumberWithOrdinal(14)).toBe('14th')

    expect(getNumberWithOrdinal(21)).toBe('21st')
    expect(getNumberWithOrdinal(22)).toBe('22nd')
    expect(getNumberWithOrdinal(23)).toBe('23rd')
    expect(getNumberWithOrdinal(24)).toBe('24th')

    expect(getNumberWithOrdinal(101)).toBe('101st')

    expect(getNumberWithOrdinal(111)).toBe('111th')
    expect(getNumberWithOrdinal(112)).toBe('112th')
    expect(getNumberWithOrdinal(113)).toBe('113th')
  })
})
