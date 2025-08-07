import { dateDiff, getDateAfter } from '../../../utils/date'
import { Duration } from '../duration'
import { TimerStage } from '../stage'
import type { TimerExternalState } from './external'

export class TimerInternalState {
  readonly pausedAt?: Date
  readonly endAt: Date
  readonly stage: TimerStage
  readonly focusSessionsCompleted: number

  static fromExternalState(state: TimerExternalState): TimerInternalState {
    const now = new Date()
    return new TimerInternalState({
      pausedAt: state.isRunning ? undefined : now,
      endAt: getDateAfter(now, state.remaining),
      stage: state.stage,
      focusSessionsCompleted: state.focusSessionsCompleted
    })
  }

  static newTestInstance({
    pausedAt = undefined,
    endAt = new Date(),
    stage = TimerStage.FOCUS,
    focusSessionsCompleted = 0
  }: Partial<TimerInternalState> = {}) {
    return new TimerInternalState({
      pausedAt,
      endAt,
      stage,
      focusSessionsCompleted
    })
  }

  constructor({
    pausedAt,
    endAt,
    stage,
    focusSessionsCompleted
  }: {
    pausedAt?: Date
    endAt: Date
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
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

  pausedWith(remaining: Duration): TimerInternalState {
    const now = new Date()
    return new TimerInternalState({
      ...this,
      pausedAt: now,
      endAt: getDateAfter(now, remaining)
    })
  }

  withUpdate(update: Partial<TimerInternalState>): TimerInternalState {
    return new TimerInternalState({ ...this, ...update })
  }
}
