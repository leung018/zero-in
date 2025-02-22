import { describe, expect, it } from 'vitest'
import { Duration, DurationInvalidInputError } from './duration'
import { assertToThrowError } from '../../test_utils/check_error'

describe('Duration', () => {
  it('should build duration from minutes, seconds or milliseconds', () => {
    const duration = new Duration({ minutes: 10, seconds: 30, milliseconds: 1000 })
    expect(duration.timeLeft()).toEqual({ minutes: 10, seconds: 31 })
    expect(duration.totalMilliseconds).toBe(631000)
  })

  it('should timeLeft round up properly', () => {
    expect(new Duration({ minutes: 0, seconds: 59, milliseconds: 999 }).timeLeft()).toEqual({
      minutes: 1,
      seconds: 0
    })
    expect(new Duration({ minutes: 10, seconds: 30, milliseconds: 200 }).timeLeft()).toEqual({
      minutes: 10,
      seconds: 31
    })
    expect(new Duration({ minutes: 10, seconds: 30, milliseconds: 0 }).timeLeft()).toEqual({
      minutes: 10,
      seconds: 30
    })
  })

  it('should prevent negative duration to created', () => {
    const errMsg = 'Duration cannot be negative'
    assertToThrowError(
      () => new Duration({ minutes: 0, seconds: -1 }),
      new DurationInvalidInputError(errMsg)
    )
    assertToThrowError(
      () => new Duration({ minutes: -1, seconds: 0 }),
      new DurationInvalidInputError(errMsg)
    )
    assertToThrowError(
      () => new Duration({ minutes: 0, seconds: 0, milliseconds: -1 }),
      new DurationInvalidInputError(errMsg)
    )
    new Duration({ milliseconds: 0 }) // should not throw error
  })

  it('should subtract return new duration that is subtracted', () => {
    const original = new Duration({ minutes: 10, seconds: 30 })

    const subtracted = original.subtract(
      new Duration({ minutes: 1, seconds: 29, milliseconds: 500 })
    )

    expect(subtracted).toEqual(new Duration({ minutes: 9, seconds: 0, milliseconds: 500 }))
    expect(original).toEqual(new Duration({ minutes: 10, seconds: 30 }))
  })

  it('should become 0 if the subtracted duration is greater than the original', () => {
    const original = new Duration({ minutes: 10, seconds: 30 })

    const subtracted = original.subtract(new Duration({ minutes: 10, seconds: 31 }))

    expect(subtracted).toEqual(new Duration({ minutes: 0, seconds: 0 }))
  })

  it('should isZero check for zero duration', () => {
    expect(new Duration({ minutes: 0, seconds: 0, milliseconds: 0 }).isZero()).toBe(true)
    expect(new Duration({ minutes: 0, seconds: 0, milliseconds: 1 }).isZero()).toBe(false)
    expect(new Duration({ minutes: 0, seconds: 1, milliseconds: 0 }).isZero()).toBe(false)
    expect(new Duration({ minutes: 1 }).isZero()).toBe(false)
  })
})
