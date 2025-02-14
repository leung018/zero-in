import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  type PeriodicTaskScheduler
} from '../../infra/scheduler'
import { Duration } from './duration'
export class Timer {
  static create() {
    return new Timer(new PeriodicTaskSchedulerImpl())
  }

  static createFake(scheduler = new FakePeriodicTaskScheduler()) {
    return new Timer(scheduler)
  }

  private constructor(private scheduler: PeriodicTaskScheduler) {}

  private onTick: (remaining: Duration) => void = () => {}
  private remaining: Duration = new Duration({ seconds: 0 })

  start(initial: Duration) {
    this.remaining = initial
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
}
