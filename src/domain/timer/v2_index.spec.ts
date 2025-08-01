import { describe, expect, it } from 'vitest'
import { TimerConfig } from './config'
import { Duration } from './duration'
import { TimerStage } from './stage'
import { FocusTimerV2 } from './v2_index'

describe('FocusTimerV2', () => {
  it('should initial state is set correctly', () => {
    const timer = FocusTimerV2.createFake({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    })

    const timerState = timer.getState()
    expect(timerState.remaining()).toEqual(new Duration({ minutes: 10 }))
    expect(timerState.isRunning()).toBe(false)
    expect(timerState.focusSessionsCompleted()).toBe(0)
    expect(timerState.stage()).toBe(TimerStage.FOCUS)
  })

  it('should able to start timer', () => {
    const timer = FocusTimerV2.createFake({
      stubbedDate: new Date('2023-01-01T00:00:00Z'),
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    })

    timer.start()

    expect(timer.getState().isRunning()).toBe(true)
    expect(timer.getState().remaining(new Date('2023-01-01T00:09:15Z'))).toEqual(
      new Duration({ seconds: 45 })
    )
  })
})
