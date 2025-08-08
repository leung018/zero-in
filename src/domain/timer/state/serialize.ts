import { TimerInternalState } from './internal'
import { TimerStateSchemas } from './schema'

type SerializedTimerState = TimerStateSchemas[4]

export function serializeTimerState(timerState: TimerInternalState): SerializedTimerState {
  return {
    dataVersion: 4,
    sessionStartTime: timerState.sessionStartTime?.getTime() ?? null,
    pausedAt: timerState.pausedAt?.getTime() ?? null,
    endAt: timerState.endAt.getTime(),
    stage: timerState.stage,
    focusSessionsCompleted: timerState.focusSessionsCompleted
  }
}

export function deserializeTimerState(data: SerializedTimerState): TimerInternalState {
  return new TimerInternalState({
    sessionStartTime: data.sessionStartTime ? new Date(data.sessionStartTime) : undefined,
    pausedAt: data.pausedAt ? new Date(data.pausedAt) : undefined,
    endAt: new Date(data.endAt),
    stage: data.stage,
    focusSessionsCompleted: data.focusSessionsCompleted
  })
}
