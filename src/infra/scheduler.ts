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
  private elapsedMs: number = 0
  private intervalMs: number = 0
  private lastTaskTime: number = 0

  scheduleTask(task: () => void, intervalMs: number): void {
    if (this.task) {
      throw TaskSchedulingError.taskAlreadyScheduledError()
    }

    this.task = task
    this.intervalMs = intervalMs
  }

  stopTask(): void {
    this.task = null
    this.elapsedMs = 0
    this.intervalMs = 0
    this.lastTaskTime = 0
  }

  advanceTime(ms: number) {
    if (this.task !== null) {
      this.elapsedMs += ms
      const intervals = Math.floor((this.elapsedMs - this.lastTaskTime) / this.intervalMs)
      for (let i = 0; i < intervals; i++) {
        this.task()
        this.lastTaskTime += this.intervalMs
      }
    }
  }

  triggerNext() {
    if (this.task) {
      this.task()
    }
  }
}
