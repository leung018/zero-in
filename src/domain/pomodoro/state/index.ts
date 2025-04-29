import { TimerStage } from '../stage'

export type TimerState = {
  remainingSeconds: number
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
