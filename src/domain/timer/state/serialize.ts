import type { TimerState } from '.'
import { Duration } from '../duration'
import { TimerStateSchemas } from './schema'

type SerializedTimerState = TimerStateSchemas[2]

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
