import { TimerInternalState } from './internal'
import { TimerStateSchemas } from './schema'

type SerializedTimerState = TimerStateSchemas[3]

export function serializeTimerState(timerState: TimerInternalState): SerializedTimerState {
  return {
    dataVersion: 3,
    pausedAt: timerState.pausedAt?.getTime() ?? null,
    endAt: timerState.endAt.getTime(),
    stage: timerState.stage,
    focusSessionsCompleted: timerState.focusSessionsCompleted
  }
}

export function deserializeTimerState(data: SerializedTimerState): TimerInternalState {
  return new TimerInternalState({
    pausedAt: data.pausedAt ? new Date(data.pausedAt) : undefined,
    endAt: new Date(data.endAt),
    stage: data.stage,
    focusSessionsCompleted: data.focusSessionsCompleted
  })
}
