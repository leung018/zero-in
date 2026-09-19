import { Duration } from '@zero-in/shared/domain/timer/duration'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { dateDiff, getDateAfter } from '@zero-in/shared/utils/date'
import type { TimerExternalState } from './external'

export class TimerInternalState {
  readonly timerId: string
  readonly sessionStartTime: Date | null
  readonly pausedAt: Date | null
  readonly endAt: Date
  readonly stage: TimerStage
  readonly focusSessionsCompleted: number
  readonly version: number

  static newPausedState({
    timerId,
    remaining,
    stage,
    focusSessionsCompleted,
    version = 0
  }: {
    timerId: string
    remaining: Duration
    stage: TimerStage
    focusSessionsCompleted: number
    version?: number
  }) {
    const now = new Date()
    return new TimerInternalState({
      timerId,
      sessionStartTime: null,
      pausedAt: now,
      endAt: getDateAfter({ from: now, duration: remaining }),
      stage,
      focusSessionsCompleted,
      version
    })
  }

  static newRunningState({
    timerId,
    sessionStartTime = null,
    remaining,
    stage,
    focusSessionsCompleted,
    version = 0
  }: {
    timerId: string
    sessionStartTime?: Date | null
    remaining: Duration
    stage: TimerStage
    focusSessionsCompleted: number
    version?: number
  }) {
    return new TimerInternalState({
      timerId,
      sessionStartTime,
      pausedAt: null,
      endAt: getDateAfter({ duration: remaining }),
      stage,
      focusSessionsCompleted,
      version
    })
  }

  static newTestInstance({
    timerId = 'temp-789',
    sessionStartTime = new Date(),
    pausedAt = null,
    endAt = getDateAfter({ duration: new Duration({ minutes: 10 }) }),
    stage = TimerStage.FOCUS,
    focusSessionsCompleted = 0,
    version = 0
  }: Partial<TimerInternalState> = {}) {
    return new TimerInternalState({
      timerId,
      sessionStartTime,
      pausedAt,
      endAt,
      stage,
      focusSessionsCompleted,
      version
    })
  }

  constructor({
    timerId,
    sessionStartTime,
    pausedAt,
    endAt,
    stage,
    focusSessionsCompleted,
    version = 0
  }: {
    timerId: string
    sessionStartTime: Date | null
    pausedAt: Date | null
    endAt: Date
    stage: TimerStage
    focusSessionsCompleted: number
    version?: number
  }) {
    this.timerId = timerId
    this.sessionStartTime = sessionStartTime
    this.pausedAt = pausedAt
    this.endAt = endAt
    this.stage = stage
    this.focusSessionsCompleted = focusSessionsCompleted
    this.version = version
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
      pausedAt: new Date(),
      version: this.version + 1
    })
  }

  copyAsResetWith(remaining: Duration): TimerInternalState {
    return TimerInternalState.newPausedState({
      ...this,
      remaining,
      version: this.version + 1
    })
  }

  copyAsRunningWith(remaining: Duration): TimerInternalState {
    return TimerInternalState.newRunningState({
      ...this,
      remaining,
      version: this.version + 1
    })
  }

  copyWith(update: {
    pausedAt?: Date | null
    endAt?: Date
    focusSessionsCompleted?: number
    stage?: TimerStage
    sessionStartTime?: Date | null
  }): TimerInternalState {
    return new TimerInternalState({
      ...this,
      ...update,
      timerId: this.timerId,
      version: this.version + 1
    })
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
