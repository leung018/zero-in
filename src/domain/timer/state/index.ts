import { Duration } from '../duration'
import { TimerStage } from '../stage'

export type TimerState = {
  remaining: Duration
  isRunning: boolean
  stage: TimerStage
  focusSessionsCompleted: number
}

export function newTestTimerState(override: Partial<TimerState> = {}): TimerState {
  return {
    remaining: new Duration({ seconds: 10 }),
    isRunning: false,
    stage: TimerStage.FOCUS,
    focusSessionsCompleted: 0,
    ...override
  }
}
