import { describe, expect, it } from 'vitest'
import { TimerConfig } from '.'
import { Duration } from '../duration'

describe('TimerConfig', () => {
  it('should reject duration less than 1 second', () => {
    const expectedError = 'Duration must not be less than 1 second'
    expect(() => {
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ milliseconds: 999 })
      })
    }).toThrowError(expectedError)
    expect(() => {
      TimerConfig.newTestInstance({
        shortBreakDuration: new Duration({ milliseconds: 999 })
      })
    }).toThrowError(expectedError)
    expect(() => {
      TimerConfig.newTestInstance({
        longBreakDuration: new Duration({ milliseconds: 999 })
      })
    }).toThrowError(expectedError)
  })

  it('should reject number of focus session less than 1', () => {
    expect(() => {
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 0
      })
    }).toThrowError('Focus sessions per cycle must be greater than 0')
  })

  it('should create instance for valid input', () => {
    const config = new TimerConfig({
      focusDuration: new Duration({ seconds: 1 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 1 }),
      focusSessionsPerCycle: 1
    })
    expect(config.focusDuration).toEqual(new Duration({ seconds: 1 }))
    expect(config.shortBreakDuration).toEqual(new Duration({ seconds: 1 }))
    expect(config.longBreakDuration).toEqual(new Duration({ seconds: 1 }))
    expect(config.focusSessionsPerCycle).toBe(1)
  })
})
