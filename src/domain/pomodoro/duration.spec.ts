import { describe, expect, it } from 'vitest'
import { Duration } from './duration'

describe('Duration', () => {
  it('should build duration from minutes and seconds', () => {
    const duration = new Duration({ minutes: 10, seconds: 30 })
    expect(duration.totalSeconds).toBe(630)
    expect(duration.minutes).toBe(10)
    expect(duration.seconds).toBe(30)
  })
})
