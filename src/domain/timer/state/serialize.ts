import type { TimerState } from '.'
import { Duration } from '../duration'
import type { TimerStage } from '../stage'

type SerializedTimerState = TimerStateSchemas[2]

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
  },
  {
    dataVersion: 2
    remainingMilliseconds: number
    isRunning: boolean
    stage: TimerStage
    focusSessionsCompleted: number
  }
]

export function serializeTimerState(timerState: TimerState): SerializedTimerState {
  return {
    dataVersion: 2,
    remainingMilliseconds: timerState.remaining.totalMilliseconds,
    isRunning: timerState.isRunning,
    stage: timerState.stage,
    focusSessionsCompleted: timerState.focusSessionsCompleted
  }
}

export function deserializeTimerState(data: SerializedTimerState): TimerState {
  return {
    remaining: new Duration({ milliseconds: data.remainingMilliseconds }),
    isRunning: data.isRunning,
    stage: data.stage,
    focusSessionsCompleted: data.focusSessionsCompleted
  }
}
