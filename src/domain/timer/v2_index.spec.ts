import { describe, expect, it } from 'vitest'
import { TimerConfig } from './config'
import { Duration } from './duration'
import { TimerStage } from './stage'
import { FocusTimerV2 } from './v2_index'
import { TimerStateV2 } from './v2_state'

describe('FocusTimerV2', () => {
  it('should initial state is set correctly', () => {
    const timer = FocusTimerV2.createFake({
      stubbedDate: new Date('2023-01-01T00:00:00.000Z'),
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    })

    expect(timer.getState()).toEqual(
      new TimerStateV2({
        startAt: new Date('2023-01-01T00:00:00.000Z'),
        endAt: new Date('2023-01-01T00:10:00.000Z'),
        isRunning: false,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      })
    )
  })
})
