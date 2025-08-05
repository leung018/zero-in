import { FakeClock } from '../utils/clock'

export interface PeriodicTaskScheduler {
  scheduleTask(task: () => void, intervalMs: number, startAfterMs?: number): void
  stopTask(): void
}

export class PeriodicTaskSchedulerImpl implements PeriodicTaskScheduler {
  private intervalId: NodeJS.Timeout | null = null

  scheduleTask(task: () => void, intervalMs: number, startAfterMs?: number) {
    if (this.intervalId) {
      throw TaskSchedulingError.taskAlreadyScheduledError()
    }

    if (startAfterMs) {
      setTimeout(() => {
        task()
        this.startInterval(task, intervalMs)
      }, startAfterMs)
    } else {
      this.startInterval(task, intervalMs)
    }
  }

  private startInterval(task: () => void, intervalMs: number) {
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
  private fakeClock: FakeClock
  private subscriptionId: number | null = null

  constructor(fakeClock = new FakeClock()) {
    this.fakeClock = fakeClock
  }

  scheduleTask(task: () => void, intervalMs: number, startAfterMs?: number): void {
    if (this.task) {
      throw TaskSchedulingError.taskAlreadyScheduledError()
    }

    this.task = task
    this.intervalMs = intervalMs
    this.lastTaskTime = this.fakeClock.getElapsedTime()

    if (startAfterMs) {
      this.lastTaskTime += startAfterMs - this.intervalMs
    }

    this.subscriptionId = this.fakeClock.subscribeTimeChange((elapsedMs) => {
      if (this.task !== null && elapsedMs - this.lastTaskTime >= this.intervalMs) {
        this.task()
        this.lastTaskTime = elapsedMs
      }
    }, intervalMs)
  }

  stopTask(): void {
    this.task = null
    this.intervalMs = 0
    this.lastTaskTime = this.fakeClock.getElapsedTime()
    if (this.subscriptionId !== null) {
      this.fakeClock.unsubscribeTimeChange(this.subscriptionId)
      this.subscriptionId = null
    }
  }
}
