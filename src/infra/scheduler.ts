export class PeriodicTaskScheduler {
  private intervalId: NodeJS.Timeout | null = null

  scheduleTask(
    task: () => void,
    { intervalMs, startAfterMs }: { intervalMs: number; startAfterMs?: number }
  ) {
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
