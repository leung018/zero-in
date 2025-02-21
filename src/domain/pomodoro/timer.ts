import config from '../../config'
import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  type PeriodicTaskScheduler
} from '../../infra/scheduler'
import type { PomodoroTimerConfig } from './config'
import { Duration } from './duration'
import { PomodoroStage } from './stage'

export class PomodoroTimer {
  static create() {
    return new PomodoroTimer({
      scheduler: new PeriodicTaskSchedulerImpl(),
      config: config.getPomodoroTimerConfig()
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    focusDuration = new Duration({ minutes: 25 }),
    restDuration = new Duration({ minutes: 5 })
  } = {}) {
    const config: PomodoroTimerConfig = { focusDuration, restDuration }
    return new PomodoroTimer({
      config,
      scheduler
    })
  }

  private stage: PomodoroStage = PomodoroStage.FOCUS

  private focusDuration: Duration

  private restDuration: Duration

  private isRunning: boolean = false

  private remaining: Duration

  private scheduler: PeriodicTaskScheduler

  private callback: (state: PomodoroTimerState) => void = () => {}

  private constructor({
    config,
    scheduler
  }: {
    config: PomodoroTimerConfig
    scheduler: PeriodicTaskScheduler
  }) {
    this.focusDuration = config.focusDuration
    this.restDuration = config.restDuration
    this.remaining = config.focusDuration
    this.scheduler = scheduler
  }

  getState(): Readonly<PomodoroTimerState> {
    return {
      remaining: this.remaining,
      isRunning: this.isRunning,
      stage: this.stage
    }
  }

  start() {
    const interval = new Duration({ seconds: 1 })
    this.scheduler.scheduleTask(() => {
      this.advanceTime(interval)
      this.publish()
    }, interval.totalMilliseconds)
    this.isRunning = true
    this.publish()
  }

  pause() {
    this.isRunning = false
    this.scheduler.stopTask()
  }

  private advanceTime(duration: Duration) {
    this.remaining = this.remaining.subtract(duration)
    if (this.remaining.isZero()) {
      this.pause()
      this.transit()
    }
  }

  setCallback(callback: (state: PomodoroTimerState) => void) {
    this.callback = callback
  }

  private publish() {
    this.callback(this.getState())
  }

  private transit() {
    if (this.stage === PomodoroStage.FOCUS) {
      this.stage = PomodoroStage.REST
      this.remaining = this.restDuration
    } else {
      this.stage = PomodoroStage.FOCUS
      this.remaining = this.focusDuration
    }
  }
}

export type PomodoroTimerState = {
  remaining: Duration
  isRunning: boolean
  stage: PomodoroStage
}
