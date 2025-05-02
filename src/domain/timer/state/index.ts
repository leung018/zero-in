import type { Duration } from '../duration'
import { TimerStage } from '../stage'

export type TimerState = {
  remainingSeconds: number
  remaining?: Duration
  isRunning: boolean
  stage: TimerStage
  focusSessionsCompleted: number
}

export function newTestTimerState(override: Partial<TimerState> = {}): TimerState {
  return {
    remainingSeconds: 100,
    isRunning: false,
    stage: TimerStage.FOCUS,
    focusSessionsCompleted: 0,
    ...override
  }
}
