import { Duration } from '@zero-in/shared/domain/timer/duration'
import { describe, expect, it } from 'vitest'
import { TimerConfig } from '.'

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

  it('should set to 1 if focusSessionsPerCycle less than 0', () => {
    let config = TimerConfig.newTestInstance({
      focusSessionsPerCycle: 0
    })
    expect(config.focusSessionsPerCycle).toBe(1)

    config = TimerConfig.newTestInstance({
      focusSessionsPerCycle: 1
    })
    expect(config.focusSessionsPerCycle).toBe(1)
    config = TimerConfig.newTestInstance({
      focusSessionsPerCycle: 10
    })
    expect(config.focusSessionsPerCycle).toBe(10)
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

  it('should isEqual return true for equal config', () => {
    const config1 = TimerConfig.newTestInstance({
      focusDuration: new Duration({ seconds: 1 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 1 }),
      focusSessionsPerCycle: 1
    })
    const config2 = TimerConfig.newTestInstance({
      focusDuration: new Duration({ seconds: 1 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 1 }),
      focusSessionsPerCycle: 1
    })
    expect(config1.isEqual(config2)).toBe(true)
  })

  it.each([
    TimerConfig.newTestInstance({
      focusDuration: new Duration({ seconds: 2 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 1 }),
      focusSessionsPerCycle: 1
    }),
    TimerConfig.newTestInstance({
      focusDuration: new Duration({ seconds: 1 }),
      shortBreakDuration: new Duration({ seconds: 2 }),
      longBreakDuration: new Duration({ seconds: 1 }),
      focusSessionsPerCycle: 1
    }),
    TimerConfig.newTestInstance({
      focusDuration: new Duration({ seconds: 1 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 2 }),
      focusSessionsPerCycle: 1
    }),
    TimerConfig.newTestInstance({
      focusDuration: new Duration({ seconds: 1 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 1 }),
      focusSessionsPerCycle: 2
    })
  ])('should isEqual return false for not equal config', (differentConfig) => {
    const baseConfig = TimerConfig.newTestInstance({
      focusDuration: new Duration({ seconds: 1 }),
      shortBreakDuration: new Duration({ seconds: 1 }),
      longBreakDuration: new Duration({ seconds: 1 }),
      focusSessionsPerCycle: 1
    })
    expect(baseConfig.isEqual(differentConfig)).toBe(false)
  })
})
