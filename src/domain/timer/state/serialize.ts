import { Duration } from '../duration'
import type { TimerExternalState } from './external'
import { TimerStateSchemas } from './schema'

type SerializedTimerState = TimerStateSchemas[2]

export function serializeTimerState(timerState: TimerExternalState): SerializedTimerState {
  return {
    dataVersion: 2,
    remainingMilliseconds: timerState.remaining.totalMilliseconds,
    isRunning: timerState.isRunning,
    stage: timerState.stage,
    focusSessionsCompleted: timerState.focusSessionsCompleted
  }
}

export function deserializeTimerState(data: SerializedTimerState): TimerExternalState {
  return {
    remaining: new Duration({ milliseconds: data.remainingMilliseconds }),
    isRunning: data.isRunning,
    stage: data.stage,
    focusSessionsCompleted: data.focusSessionsCompleted
  }
}
