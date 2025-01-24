import { describe, expect, it } from 'vitest'
import { formatTimeNumber, Time } from '../time'

describe('Time', () => {
  it('should reject invalid time', () => {
    expect(() => new Time(-1, 0)).toThrow('Invalid hour')
    expect(() => new Time(0, -1)).toThrow('Invalid minute')
    expect(() => new Time(24, 0)).toThrow('Invalid hour')
    expect(() => new Time(0, 60)).toThrow('Invalid minute')
  })

  it('should accept valid time', () => {
    new Time(0, 0)
    new Time(23, 59)
  })

  it('should get hour and minute', () => {
    const time = new Time(12, 34)
    expect(time.hour).toBe(12)
    expect(time.minute).toBe(34)
  })

  it('should isBefore check the time', () => {
    expect(new Time(0, 55).isBefore(new Time(0, 55))).toBe(false)

    expect(new Time(0, 55).isBefore(new Time(0, 56))).toBe(true)
    expect(new Time(0, 55).isBefore(new Time(1, 55))).toBe(true)

    expect(new Time(2, 55).isBefore(new Time(1, 56))).toBe(false)
  })
})

describe('formatTimeNumber', () => {
  it('should format number', () => {
    expect(formatTimeNumber(0)).toBe('00')
    expect(formatTimeNumber(9)).toBe('09')
    expect(formatTimeNumber(10)).toBe('10')
    expect(formatTimeNumber(59)).toBe('59')
  })
})
