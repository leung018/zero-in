import { TimerInternalState } from './internal'
import { TimerStateSchemas } from './schema'

type SerializedTimerState = TimerStateSchemas[6]

export function serializeTimerState(timerState: TimerInternalState): SerializedTimerState {
  return {
    dataVersion: 6,
    sessionStartTime: timerState.sessionStartTime?.getTime() ?? null,
    pausedAt: timerState.pausedAt?.getTime() ?? null,
    endAt: timerState.endAt.getTime(),
    stage: timerState.stage,
    focusSessionsCompleted: timerState.focusSessionsCompleted,
    timerId: timerState.timerId,
    version: timerState.version
  }
}

export function deserializeTimerState(data: SerializedTimerState): TimerInternalState {
  return new TimerInternalState({
    timerId: data.timerId,
    sessionStartTime: data.sessionStartTime ? new Date(data.sessionStartTime) : null,
    pausedAt: data.pausedAt ? new Date(data.pausedAt) : null,
    endAt: new Date(data.endAt),
    stage: data.stage,
    focusSessionsCompleted: data.focusSessionsCompleted,
    version: data.version
  })
}
