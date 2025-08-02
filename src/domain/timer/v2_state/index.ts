import { Duration } from '../duration'
import { TimerStage } from '../stage'

export type TimerStatePayload = {
  pausedAt?: Date
  endAt: Date
  stage: TimerStage
  focusSessionsCompleted: number
}

export class TimerStateV2 {
  private payload: TimerStatePayload

  constructor(payload: TimerStatePayload) {
    this.payload = payload
  }

  remaining(now: Date = new Date()): Duration {
    if (this.payload.pausedAt === undefined) {
      return dateDiff(now, this.payload.endAt)
    }
    return dateDiff(this.payload.pausedAt, this.payload.endAt)
  }

  isRunning(): boolean {
    return this.payload.pausedAt === undefined
  }

  focusSessionsCompleted(): number {
    return this.payload.focusSessionsCompleted
  }

  stage(): TimerStage {
    return this.payload.stage
  }

  withUpdate(update: Partial<TimerStatePayload>): TimerStateV2 {
    return new TimerStateV2({ ...this.payload, ...update })
  }
}

function dateDiff(start: Date, end: Date): Duration {
  return new Duration({
    milliseconds: end.getTime() - start.getTime()
  })
}
