import { TimerStage } from '../stage'

export type TimerStateV2Payload = {
  startAt: Date
  endAt: Date
  pausedAt?: Date
  isRunning: boolean
  stage: TimerStage
  focusSessionsCompleted: number
}

export class TimerStateV2 {
  private payload: TimerStateV2Payload

  constructor(payload: TimerStateV2Payload) {
    this.payload = payload
  }
}
