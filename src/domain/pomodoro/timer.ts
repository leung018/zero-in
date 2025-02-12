import { Duration } from './duration'

interface PeriodicTaskScheduler {
  scheduleTask(task: () => void, ms: number): void
  stopTask(): void
}

class PeriodicTaskSchedulerImpl implements PeriodicTaskScheduler {
  private intervalId: NodeJS.Timeout | null = null

  scheduleTask(task: () => void, ms: number) {
    const intervalId = setInterval(task, ms)
    this.intervalId = intervalId
  }

  stopTask(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }
}

export class FakePeriodicTaskScheduler implements PeriodicTaskScheduler {
  private task: (() => void) | null = null

  scheduleTask(task: () => void, ms: number): void {
    this.task = task
  }

  stopTask(): void {}

  triggerNext() {
    if (this.task) {
      this.task()
    }
  }
}

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
