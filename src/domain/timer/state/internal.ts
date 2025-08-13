import { dateDiff, getDateAfter } from '../../../utils/date'
import { Duration } from '../duration'
import { TimerStage } from '../stage'
import type { TimerExternalState } from './external'

export class TimerInternalState {
  readonly timerId: string = ''
  readonly sessionStartTime?: Date
  readonly pausedAt?: Date
  readonly endAt: Date
  readonly stage: TimerStage
  readonly focusSessionsCompleted: number

  static newPausedState({
    timerId = 'temp-123',
    remaining,
    stage,
    focusSessionsCompleted
  }: {
    timerId?: string
    remaining: Duration
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    const now = new Date()
    return new TimerInternalState({
      timerId,
      sessionStartTime: undefined,
      pausedAt: now,
      endAt: getDateAfter({ from: now, duration: remaining }),
      stage,
      focusSessionsCompleted
    })
  }

  static newRunningState({
    timerId = 'temp-456',
    sessionStartTime,
    remaining,
    stage,
    focusSessionsCompleted
  }: {
    timerId?: string
    sessionStartTime?: Date
    remaining: Duration
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    return new TimerInternalState({
      timerId,
      sessionStartTime,
      pausedAt: undefined,
      endAt: getDateAfter({ duration: remaining }),
      stage,
      focusSessionsCompleted
    })
  }

  static newTestInstance({
    timerId = 'temp-789',
    sessionStartTime = new Date(),
    pausedAt = undefined,
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
    timerId = '',
    sessionStartTime,
    pausedAt,
    endAt,
    stage,
    focusSessionsCompleted
  }: {
    timerId?: string
    sessionStartTime?: Date
    pausedAt?: Date
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
    pausedAt?: Date
    endAt?: Date
    focusSessionsCompleted?: number
    stage?: TimerStage
    sessionStartTime?: Date
  }): TimerInternalState {
    return new TimerInternalState({ ...this, ...update, timerId: this.timerId })
  }
}
