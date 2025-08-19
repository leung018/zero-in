import { describe, expect, it } from 'vitest'
import { Duration } from './duration'

describe('Duration', () => {
  it('should build duration from minutes, seconds or milliseconds', () => {
    const duration = new Duration({ minutes: 10, seconds: 30, milliseconds: 1000 })
    expect(duration.remainingSeconds()).toBe(10 * 60 + 31)
    expect(duration.totalMilliseconds).toBe(631000)
  })

  it('should remainingSeconds round up properly', () => {
    expect(new Duration({ minutes: 0, seconds: 59, milliseconds: 999 }).remainingSeconds()).toBe(60)
    expect(new Duration({ minutes: 10, seconds: 30, milliseconds: 200 }).remainingSeconds()).toBe(
      10 * 60 + 31
    )
    expect(new Duration({ minutes: 10, seconds: 30, milliseconds: 0 }).remainingSeconds()).toBe(
      10 * 60 + 30
    )
  })

  it('should prevent negative duration to created', () => {
    const errMsg = 'Duration cannot be negative'
    expect(() => new Duration({ minutes: 0, seconds: -1 })).toThrow(errMsg)
    expect(() => new Duration({ minutes: -1, seconds: 0 })).toThrow(errMsg)
    expect(() => new Duration({ minutes: 0, seconds: 0, milliseconds: -1 })).toThrow(errMsg)
    expect(() => new Duration({ milliseconds: 0 })).not.toThrow()
  })

  it('should isZero check for zero duration', () => {
    expect(new Duration({ minutes: 0, seconds: 0, milliseconds: 0 }).isZero()).toBe(true)
    expect(new Duration({ minutes: 0, seconds: 0, milliseconds: 1 }).isZero()).toBe(false)
    expect(new Duration({ minutes: 0, seconds: 1, milliseconds: 0 }).isZero()).toBe(false)
    expect(new Duration({ minutes: 1 }).isZero()).toBe(false)
  })

  it('should isEqual check for equal duration', () => {
    expect(new Duration({ minutes: 1 }).isEqual(new Duration({ seconds: 60 }))).toBe(true)
    expect(
      new Duration({ minutes: 1 }).isEqual(new Duration({ seconds: 60, milliseconds: 1 }))
    ).toBe(false)
  })
})
