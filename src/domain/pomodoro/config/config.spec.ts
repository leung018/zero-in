import { describe, expect, it } from 'vitest'
import { PomodoroTimerConfig } from '.'
import { Duration } from '../duration'

describe('PomodoroTimerConfig', () => {
  it('should reject 0 duration', () => {
    const expectedError = 'Duration must not be less than 1 second'
    expect(() => {
      PomodoroTimerConfig.newTestInstance({
        focusDuration: new Duration({ milliseconds: 999 })
      })
    }).toThrowError(expectedError)
    expect(() => {
      PomodoroTimerConfig.newTestInstance({
        shortBreakDuration: new Duration({ milliseconds: 999 })
      })
    }).toThrowError(expectedError)
    expect(() => {
      PomodoroTimerConfig.newTestInstance({
        longBreakDuration: new Duration({ milliseconds: 999 })
      })
    }).toThrowError(expectedError)
  })

  it('should reject number of pomodori per cycle less than 1', () => {
    expect(() => {
      PomodoroTimerConfig.newTestInstance({
        focusSessionsPerCycle: 0
      })
    }).toThrowError('Number of pomodori per cycle must be greater than 0')
  })

  it('should create instance for valid input', () => {
    const config = new PomodoroTimerConfig({
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
