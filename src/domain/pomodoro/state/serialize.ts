import type { TimerState } from '.'
import type { PomodoroStage } from '../stage'

type SerializedTimerState = TimerStateSchemas[1]

export type TimerStateSchemas = [
  {
    remainingSeconds: number
    isRunning: boolean
    stage: PomodoroStage
    numOfPomodoriCompleted: number
  },
  {
    dataVersion: 1
    remainingSeconds: number
    isRunning: boolean
    stage: PomodoroStage
    focusSessionsCompleted: number
  }
]

export function serializeTimerState(timerState: TimerState): SerializedTimerState {
  return {
    dataVersion: 1,
    remainingSeconds: timerState.remainingSeconds,
    isRunning: timerState.isRunning,
    stage: timerState.stage,
    focusSessionsCompleted: timerState.numOfPomodoriCompleted
  }
}

export function deserializeTimerState(data: SerializedTimerState): TimerState {
  return {
    remainingSeconds: data.remainingSeconds,
    isRunning: data.isRunning,
    stage: data.stage,
    numOfPomodoriCompleted: data.focusSessionsCompleted
  }
}
