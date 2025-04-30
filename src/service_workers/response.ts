import type { TimerState } from '@/domain/timer/state'

export enum WorkResponseName {
  TIMER_STATE,
  FOCUS_SESSION_RECORDS_UPDATED
}

export type WorkResponse =
  | {
      name: WorkResponseName.TIMER_STATE
      payload: TimerState
    }
  | {
      name: WorkResponseName.FOCUS_SESSION_RECORDS_UPDATED
    }
