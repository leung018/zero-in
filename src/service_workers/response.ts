import type { PomodoroTimerState } from '../domain/pomodoro/timer'

export enum WorkResponseName {
  TIMER_STATE,
  POMODORO_RECORDS_UPDATED
}

type WorkResponsePayloadMap = {
  [WorkResponseName.TIMER_STATE]: PomodoroTimerState
  [WorkResponseName.POMODORO_RECORDS_UPDATED]: undefined
}

export type WorkResponse = {
  name: WorkResponseName
  payload?: WorkResponsePayloadMap[WorkResponseName]
}
