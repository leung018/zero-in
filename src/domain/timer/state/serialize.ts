import type { TimerState } from '.'
import type { TimerStage } from '../stage'

type SerializedTimerState = TimerStateSchemas[1]

export type TimerStateSchemas = [
  {
    remainingSeconds: number
    isRunning: boolean
    stage: TimerStage
    numOfPomodoriCompleted: number
  },
  {
    dataVersion: 1
    remainingSeconds: number
    isRunning: boolean
    stage: TimerStage
    focusSessionsCompleted: number
  }
]

export function serializeTimerState(timerState: TimerState): SerializedTimerState {
  return {
    dataVersion: 1,
    remainingSeconds: timerState.remainingSeconds,
    isRunning: timerState.isRunning,
    stage: timerState.stage,
    focusSessionsCompleted: timerState.focusSessionsCompleted
  }
}

export function deserializeTimerState(data: SerializedTimerState): TimerState {
  return {
    remainingSeconds: data.remainingSeconds,
    isRunning: data.isRunning,
    stage: data.stage,
    focusSessionsCompleted: data.focusSessionsCompleted
  }
}
