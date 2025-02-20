import { FakePeriodicTaskScheduler, type PeriodicTaskScheduler } from '../../infra/scheduler'
import { Duration } from './duration'
import { PomodoroState } from './state'

export class PomodoroTimer {
  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    focusDuration = new Duration({ minutes: 25 })
  } = {}) {
    return new PomodoroTimer({
      focusDuration,
      scheduler
    })
  }

  private pomodoroState: PomodoroState = PomodoroState.FOCUS

  private isRunning: boolean = false

  private remaining: Duration = new Duration({ seconds: 0 })

  private scheduler: PeriodicTaskScheduler

  private callbacks: ((state: PomodoroTimerState) => void)[] = []

  private constructor({
    focusDuration,
    scheduler
  }: {
    focusDuration: Duration
    scheduler: PeriodicTaskScheduler
  }) {
    this.remaining = focusDuration
    this.scheduler = scheduler
  }

  getState(): Readonly<PomodoroTimerState> {
    return {
      remaining: this.remaining,
      isRunning: this.isRunning,
      pomodoroState: this.pomodoroState
    }
  }

  start() {
    const interval = new Duration({ seconds: 1 })
    this.scheduler.scheduleTask(() => {
      this.advanceTime(interval)
      this.publish()
    }, interval.totalSeconds * 1000)
    this.isRunning = true
    this.publish()
  }

  pause() {
    this.isRunning = false
    this.scheduler.stopTask()
  }

  private advanceTime(duration: Duration) {
    this.remaining = this.remaining.subtract(duration)
  }

  subscribe(callback: (state: PomodoroTimerState) => void) {
    this.callbacks.push(callback)
  }

  private publish() {
    this.callbacks.forEach((callback) => {
      callback(this.getState())
    })
  }
}

export type PomodoroTimerState = {
  remaining: Duration
  isRunning: boolean
  pomodoroState: PomodoroState
}
