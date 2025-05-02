import type { TimerStage } from '../domain/timer/stage'

export enum WorkResponseName {
  TIMER_STATE,
  FOCUS_SESSION_RECORDS_UPDATED
}

export type WorkResponse =
  | {
      name: WorkResponseName.TIMER_STATE
      payload: {
        remainingSeconds: number
        isRunning: boolean
        stage: TimerStage
        focusSessionsCompleted: number
      }
    }
  | {
      name: WorkResponseName.FOCUS_SESSION_RECORDS_UPDATED
    }
