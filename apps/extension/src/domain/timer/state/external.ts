import { Duration } from '@zero-in/shared/domain/timer/duration'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'

export type TimerExternalState = {
  remaining: Duration
  isRunning: boolean
  stage: TimerStage
  focusSessionsCompleted: number
}

export function newTestTimerExternalState(
  override: Partial<TimerExternalState> = {}
): TimerExternalState {
  return {
    remaining: new Duration({ seconds: 10 }),
    isRunning: false,
    stage: TimerStage.FOCUS,
    focusSessionsCompleted: 0,
    ...override
  }
}
