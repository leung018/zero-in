import { dateDiff, getDateAfter } from '../../../utils/date'
import { Duration } from '../duration'
import { TimerStage } from '../stage'
import type { TimerExternalState } from './external'

export class TimerInternalState {
  readonly sessionStartTime?: Date
  readonly pausedAt?: Date
  readonly endAt: Date
  readonly stage: TimerStage
  readonly focusSessionsCompleted: number

  static newPausedState({
    remaining,
    stage,
    focusSessionsCompleted
  }: {
    remaining: Duration
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    const now = new Date()
    return new TimerInternalState({
      pausedAt: now,
      endAt: getDateAfter({ from: now, duration: remaining }),
      stage,
      focusSessionsCompleted
    })
  }

  static newRunningState({
    sessionStartTime,
    remaining,
    stage,
    focusSessionsCompleted
  }: {
    sessionStartTime?: Date
    remaining: Duration
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    return new TimerInternalState({
      sessionStartTime,
      pausedAt: undefined,
      endAt: getDateAfter({ duration: remaining }),
      stage,
      focusSessionsCompleted
    })
  }

  static newTestInstance({
    sessionStartTime = new Date(),
    pausedAt = undefined,
    endAt = getDateAfter({ duration: new Duration({ minutes: 10 }) }),
    stage = TimerStage.FOCUS,
    focusSessionsCompleted = 0
  }: Partial<TimerInternalState> = {}) {
    return new TimerInternalState({
      sessionStartTime,
      pausedAt,
      endAt,
      stage,
      focusSessionsCompleted
    })
  }

  constructor({
    sessionStartTime,
    pausedAt,
    endAt,
    stage,
    focusSessionsCompleted
  }: {
    sessionStartTime?: Date
    pausedAt?: Date
    endAt: Date
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    this.sessionStartTime = sessionStartTime
    this.pausedAt = pausedAt
    this.endAt = endAt
    this.stage = stage
    this.focusSessionsCompleted = focusSessionsCompleted
  }

  toExternalState(now = new Date()): TimerExternalState {
    return {
      remaining: this.remaining(now),
      stage: this.stage,
      focusSessionsCompleted: this.focusSessionsCompleted,
      isRunning: this.isRunning()
    }
  }

  remaining(now: Date = new Date()): Duration {
    if (this.pausedAt === undefined) {
      return dateDiff(now, this.endAt)
    }
    return dateDiff(this.pausedAt, this.endAt)
  }

  isRunning(): boolean {
    return this.pausedAt === undefined
  }

  copyAsPausedNow(): TimerInternalState {
    return new TimerInternalState({
      ...this,
      pausedAt: new Date()
    })
  }

  copyAsPausedWith(remaining: Duration): TimerInternalState {
    return TimerInternalState.newPausedState({
      ...this,
      remaining
    })
  }

  copyAsRunningWith(remaining: Duration): TimerInternalState {
    return TimerInternalState.newRunningState({
      ...this,
      remaining
    })
  }

  copyWith(update: { focusSessionsCompleted?: number; stage?: TimerStage }): TimerInternalState {
    return new TimerInternalState({ ...this, ...update })
  }
}
