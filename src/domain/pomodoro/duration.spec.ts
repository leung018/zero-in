import { describe, expect, it } from 'vitest'
import { Duration } from './duration'

describe('Duration', () => {
  it('should build duration from minutes and seconds', () => {
    const duration = new Duration({ minutes: 10, seconds: 30 })
    expect(duration.totalSeconds).toBe(630)
    expect(duration.minutes).toBe(10)
    expect(duration.seconds).toBe(30)
  })

  it('should subtract return new duration that is subtracted', () => {
    const original = new Duration({ minutes: 10, seconds: 30 })

    const subtracted = original.subtract(new Duration({ minutes: 1, seconds: 29 }))

    expect(subtracted).toEqual(new Duration({ minutes: 9, seconds: 1 }))
    expect(original).toEqual(new Duration({ minutes: 10, seconds: 30 }))
  })
})
