import { FakeTimeCounter } from '../utils/fake_time_counter'

export interface PeriodicTaskScheduler {
  scheduleTask(task: () => void, ms: number): void
  stopTask(): void
}

export class PeriodicTaskSchedulerImpl implements PeriodicTaskScheduler {
  private intervalId: NodeJS.Timeout | null = null

  scheduleTask(task: () => void, intervalMs: number) {
    if (this.intervalId) {
      throw TaskSchedulingError.taskAlreadyScheduledError()
    }

    const intervalId = setInterval(task, intervalMs)
    this.intervalId = intervalId
  }

  stopTask(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

export class TaskSchedulingError extends Error {
  static taskAlreadyScheduledError() {
    return new TaskSchedulingError(
      'Task is already scheduled. Stop the task before scheduling a new one.'
    )
  }
}

export class FakePeriodicTaskScheduler implements PeriodicTaskScheduler {
  private task: (() => void) | null = null
  private intervalMs: number = 0
  private lastTaskTime: number = 0
  private fakeTimeCounter: FakeTimeCounter
  private subscriptionId: number | null = null

  constructor(fakeTimeCounter = new FakeTimeCounter()) {
    this.fakeTimeCounter = fakeTimeCounter
  }

  scheduleTask(task: () => void, intervalMs: number): void {
    if (this.task) {
      throw TaskSchedulingError.taskAlreadyScheduledError()
    }

    this.task = task
    this.intervalMs = intervalMs
    this.lastTaskTime = this.fakeTimeCounter.getElapsedSystemTime()

    this.subscriptionId = this.fakeTimeCounter.subscribeTimeChange((elapsedMs) => {
      const intervals = Math.floor((elapsedMs - this.lastTaskTime) / this.intervalMs)
      for (let i = 0; i < intervals; i++) {
        if (this.task !== null) this.task()
        this.lastTaskTime += this.intervalMs
      }
    })
  }

  stopTask(): void {
    this.task = null
    this.intervalMs = 0
    this.lastTaskTime = this.fakeTimeCounter.getElapsedSystemTime()
    if (this.subscriptionId !== null) {
      this.fakeTimeCounter.unsubscribeTimeChange(this.subscriptionId)
      this.subscriptionId = null
    }
  }

  advanceTime(ms: number) {
    this.fakeTimeCounter.advanceTime(ms)
  }
}
