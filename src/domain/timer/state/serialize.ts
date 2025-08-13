import { TimerInternalState } from './internal'
import { TimerStateSchemas } from './schema'

type SerializedTimerState = TimerStateSchemas[5]

export function serializeTimerState(timerState: TimerInternalState): SerializedTimerState {
  return {
    dataVersion: 5,
    sessionStartTime: timerState.sessionStartTime?.getTime() ?? null,
    pausedAt: timerState.pausedAt?.getTime() ?? null,
    endAt: timerState.endAt.getTime(),
    stage: timerState.stage,
    focusSessionsCompleted: timerState.focusSessionsCompleted,
    timerId: timerState.timerId
  }
}

export function deserializeTimerState(data: SerializedTimerState): TimerInternalState {
  return new TimerInternalState({
    timerId: data.timerId,
    sessionStartTime: data.sessionStartTime ? new Date(data.sessionStartTime) : undefined,
    pausedAt: data.pausedAt ? new Date(data.pausedAt) : undefined,
    endAt: new Date(data.endAt),
    stage: data.stage,
    focusSessionsCompleted: data.focusSessionsCompleted
  })
}
