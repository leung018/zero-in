import { describe, expect, it } from 'vitest'
import { Time } from '.'

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

  it('should print hh:mm string', () => {
    expect(new Time(0, 0).toHhMmString()).toBe('00:00')
    expect(new Time(1, 1).toHhMmString()).toBe('01:01')
    expect(new Time(12, 59).toHhMmString()).toBe('12:59')
  })
})
