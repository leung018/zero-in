import { describe, expect, it } from 'vitest'
import { Duration, DurationInvalidInputError } from './duration'
import { assertToThrowError } from '../../test_utils/check_error'

describe('Duration', () => {
  it('should build duration from minutes and seconds', () => {
    const duration = new Duration({ minutes: 10, seconds: 30 })
    expect(duration.totalSeconds).toBe(630)
    expect(duration.minutes).toBe(10)
    expect(duration.seconds).toBe(30)
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
    new Duration({ seconds: 0 }) // should not throw error
  })

  it('should subtract return new duration that is subtracted', () => {
    const original = new Duration({ minutes: 10, seconds: 30 })

    const subtracted = original.subtract(new Duration({ minutes: 1, seconds: 29 }))

    expect(subtracted).toEqual(new Duration({ minutes: 9, seconds: 1 }))
    expect(original).toEqual(new Duration({ minutes: 10, seconds: 30 }))
  })

  it('should become 0 if the subtracted duration is greater than the original', () => {
    const original = new Duration({ minutes: 10, seconds: 30 })

    const subtracted = original.subtract(new Duration({ minutes: 10, seconds: 31 }))

    expect(subtracted).toEqual(new Duration({ minutes: 0, seconds: 0 }))
  })

  it('should isZero check for zero duration', () => {
    expect(new Duration({ minutes: 0, seconds: 0 }).isZero()).toBe(true)
    expect(new Duration({ minutes: 0, seconds: 1 }).isZero()).toBe(false)
    expect(new Duration({ minutes: 1, seconds: 0 }).isZero()).toBe(false)
  })
})
