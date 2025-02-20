import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  type PeriodicTaskScheduler
} from '../../infra/scheduler'
import { Duration } from './duration'

export class Timer {
  static create(initialDuration: Duration) {
    return new Timer({
      scheduler: new PeriodicTaskSchedulerImpl(),
      initialDuration
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    initialDuration = new Duration({ minutes: 25 })
  } = {}) {
    return new Timer({
      scheduler,
      initialDuration
    })
  }

  private readonly scheduler: PeriodicTaskScheduler

  private onTick: (state: Readonly<TimerState>) => void = () => {}

  private remaining: Duration = new Duration({ seconds: 0 })

  private isRunning: boolean = false

  private constructor({
    scheduler,
    initialDuration
  }: {
    scheduler: PeriodicTaskScheduler
    initialDuration: Duration
  }) {
    this.scheduler = scheduler
    this.remaining = initialDuration
  }

  reset(duration: Duration) {
    this.pause()
    this.remaining = duration
  }

  start() {
    const interval = new Duration({ seconds: 1 })
    this.scheduler.scheduleTask(() => {
      this.advanceTime(interval)
      this.onTick(this.getState())
    }, interval.totalSeconds * 1000)
    this.isRunning = true
  }

  pause() {
    this.isRunning = false
    this.scheduler.stopTask()
  }

  private advanceTime(duration: Duration) {
    this.remaining = this.remaining.subtract(duration)
  }

  subscribe(callback: (state: Readonly<TimerState>) => void) {
    this.onTick = callback
  }

  getState(): Readonly<TimerState> {
    return {
      remaining: this.remaining,
      isRunning: this.isRunning
    }
  }
}

export type TimerState = {
  remaining: Duration
  isRunning: boolean
}
