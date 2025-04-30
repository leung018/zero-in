import type { TimerState } from '@/domain/timer/state'

export enum WorkResponseName {
  TIMER_STATE,
  POMODORO_RECORDS_UPDATED
}

export type WorkResponse =
  | {
      name: WorkResponseName.TIMER_STATE
      payload: TimerState
    }
  | {
      name: WorkResponseName.POMODORO_RECORDS_UPDATED
    }
