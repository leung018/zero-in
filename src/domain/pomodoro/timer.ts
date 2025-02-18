import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  type PeriodicTaskScheduler
} from '../../infra/scheduler'
import { Duration } from './duration'
export class Timer {
  static create() {
    return new Timer({
      scheduler: new PeriodicTaskSchedulerImpl(),
      focusDuration: new Duration({ minutes: 25 })
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    focusDuration = new Duration({ minutes: 25 })
  } = {}) {
    return new Timer({
      scheduler,
      focusDuration
    })
  }

  private readonly scheduler: PeriodicTaskScheduler
  private onTick: (remaining: Duration) => void = () => {}
  private remaining: Duration = new Duration({ seconds: 0 })

  private constructor({
    scheduler,
    focusDuration
  }: {
    scheduler: PeriodicTaskScheduler
    focusDuration: Duration
  }) {
    this.scheduler = scheduler
    this.remaining = focusDuration
  }

  start() {
    const interval = new Duration({ seconds: 1 })
    this.scheduler.scheduleTask(() => this.advanceTime(interval), interval.totalSeconds * 1000)
  }

  private advanceTime(duration: Duration) {
    this.remaining = this.remaining.subtract(duration)
    this.onTick(this.remaining)
  }

  setOnTick(callback: (remaining: Duration) => void) {
    this.onTick = callback
  }

  getRemaining() {
    return new Duration({ seconds: this.remaining.totalSeconds })
  }
}
