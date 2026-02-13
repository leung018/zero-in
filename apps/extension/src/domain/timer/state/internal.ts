import { dateDiff, getDateAfter } from '@zero-in/shared/utils/date'
import { Duration } from '../duration'
import { TimerStage } from '../stage'
import type { TimerExternalState } from './external'

export class TimerInternalState {
  readonly timerId: string
  readonly sessionStartTime: Date | null
  readonly pausedAt: Date | null
  readonly endAt: Date
  readonly stage: TimerStage
  readonly focusSessionsCompleted: number

  static newPausedState({
    timerId,
    remaining,
    stage,
    focusSessionsCompleted
  }: {
    timerId: string
    remaining: Duration
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    const now = new Date()
    return new TimerInternalState({
      timerId,
      sessionStartTime: null,
      pausedAt: now,
      endAt: getDateAfter({ from: now, duration: remaining }),
      stage,
      focusSessionsCompleted
    })
  }

  static newRunningState({
    timerId,
    sessionStartTime = null,
    remaining,
    stage,
    focusSessionsCompleted
  }: {
    timerId: string
    sessionStartTime?: Date | null
    remaining: Duration
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    return new TimerInternalState({
      timerId,
      sessionStartTime,
      pausedAt: null,
      endAt: getDateAfter({ duration: remaining }),
      stage,
      focusSessionsCompleted
    })
  }

  static newTestInstance({
    timerId = 'temp-789',
    sessionStartTime = new Date(),
    pausedAt = null,
    endAt = getDateAfter({ duration: new Duration({ minutes: 10 }) }),
    stage = TimerStage.FOCUS,
    focusSessionsCompleted = 0
  }: Partial<TimerInternalState> = {}) {
    return new TimerInternalState({
      timerId,
      sessionStartTime,
      pausedAt,
      endAt,
      stage,
      focusSessionsCompleted
    })
  }

  constructor({
    timerId,
    sessionStartTime,
    pausedAt,
    endAt,
    stage,
    focusSessionsCompleted
  }: {
    timerId: string
    sessionStartTime: Date | null
    pausedAt: Date | null
    endAt: Date
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    this.timerId = timerId
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
    if (this.pausedAt) {
      return dateDiff(this.pausedAt, this.endAt)
    }
    return dateDiff(now, this.endAt)
  }

  isRunning(): boolean {
    return this.pausedAt === null
  }

  copyAsPausedNow(): TimerInternalState {
    return new TimerInternalState({
      ...this,
      pausedAt: new Date()
    })
  }

  copyAsResetWith(remaining: Duration): TimerInternalState {
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

  copyWith(update: {
    pausedAt?: Date | null
    endAt?: Date
    focusSessionsCompleted?: number
    stage?: TimerStage
    sessionStartTime?: Date | null
  }): TimerInternalState {
    return new TimerInternalState({ ...this, ...update, timerId: this.timerId })
  }

  equalsIgnoringId(other: TimerInternalState): boolean {
    return (
      this.sessionStartTime?.getTime() === other.sessionStartTime?.getTime() &&
      this.pausedAt?.getTime() === other.pausedAt?.getTime() &&
      this.endAt.getTime() === other.endAt.getTime() &&
      this.stage === other.stage &&
      this.focusSessionsCompleted === other.focusSessionsCompleted
    )
  }
}
