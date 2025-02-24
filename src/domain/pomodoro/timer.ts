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

  private onTimerUpdate: (state: PomodoroTimerState) => void = () => {}

  private onStageTransit: () => void = () => {}

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
    if (this.isRunning) {
      return
    }

    const timerUnit = new Duration({ milliseconds: 100 })

    this.scheduler.scheduleTask(() => {
      this.advanceTime(timerUnit)
      this.publishTimerUpdate()
    }, timerUnit.totalMilliseconds)
    this.isRunning = true
    this.publishTimerUpdate()
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

  setOnTimerUpdate(callback: (state: PomodoroTimerState) => void) {
    this.onTimerUpdate = callback
  }

  setOnStageTransit(callback: () => void) {
    this.onStageTransit = callback
  }

  private publishTimerUpdate() {
    this.onTimerUpdate(this.getState())
  }

  private transit() {
    if (this.stage === PomodoroStage.FOCUS) {
      this.stage = PomodoroStage.REST
      this.remaining = this.restDuration
    } else {
      this.stage = PomodoroStage.FOCUS
      this.remaining = this.focusDuration
    }
    this.onStageTransit()
  }
}

export type PomodoroTimerState = {
  remaining: Duration
  isRunning: boolean
  stage: PomodoroStage
}
