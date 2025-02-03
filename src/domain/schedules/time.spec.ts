import { describe, expect, it } from 'vitest'
import { formatTimeNumber, Time, TimeInvalidInputError } from './time'
import { assertToThrowError } from '../../test_utils/check_error'

describe('Time', () => {
  it('should reject invalid time', () => {
    assertToThrowError(() => new Time(-1, 0), new TimeInvalidInputError('Invalid hour'))
    assertToThrowError(() => new Time(0, -1), new TimeInvalidInputError('Invalid minute'))
    assertToThrowError(() => new Time(24, 0), new TimeInvalidInputError('Invalid hour'))
    assertToThrowError(() => new Time(0, 60), new TimeInvalidInputError('Invalid minute'))
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

  it('should create Time from Date', () => {
    const date = new Date('2025-02-03T11:01:59')
    const time = Time.fromDate(date)
    expect(time.hour).toBe(11)
    expect(time.minute).toBe(1)
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
