export interface PeriodicTaskScheduler {
  scheduleTask(task: () => void, ms: number): void
  stopTask(): void
}

export class PeriodicTaskSchedulerImpl implements PeriodicTaskScheduler {
  private intervalId: NodeJS.Timeout | null = null

  scheduleTask(task: () => void, ms: number) {
    if (this.intervalId) {
      throw new TaskSchedulingError(
        'Task is already scheduled. Stop the task before scheduling a new one.'
      )
    }

    const intervalId = setInterval(task, ms)
    this.intervalId = intervalId
  }

  stopTask(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

export class TaskSchedulingError extends Error {}

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
