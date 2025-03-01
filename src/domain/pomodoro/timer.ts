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
    shortBreakDuration = new Duration({ minutes: 5 }),
    longBreakDuration = new Duration({ minutes: 15 }),
    numOfFocusPerCycle = 4
  } = {}) {
    const config: PomodoroTimerConfig = {
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      numOfFocusPerCycle
    }
    return new PomodoroTimer({
      config,
      scheduler
    })
  }

  private stage: PomodoroStage = PomodoroStage.FOCUS

  private config: PomodoroTimerConfig

  private isRunning: boolean = false

  private remaining: Duration

  private numOfFocusCompleted: number = 0

  private scheduler: PeriodicTaskScheduler

  private timerUpdateSubscriptionManager = new SubscriptionManager<PomodoroTimerUpdate>()

  private onStageTransit: () => void = () => {}

  private constructor({
    config,
    scheduler
  }: {
    config: PomodoroTimerConfig
    scheduler: PeriodicTaskScheduler
  }) {
    this.config = {
      ...config,
      focusDuration: this.roundUpToSeconds(config.focusDuration),
      shortBreakDuration: this.roundUpToSeconds(config.shortBreakDuration),
      longBreakDuration: this.roundUpToSeconds(config.longBreakDuration)
    }
    this.remaining = config.focusDuration
    this.scheduler = scheduler
  }

  private roundUpToSeconds(duration: Duration): Duration {
    return new Duration({
      seconds: duration.remainingSeconds()
    })
  }

  getState(): Readonly<PomodoroTimerState> {
    return {
      remaining: this.remaining,
      isRunning: this.isRunning,
      stage: this.stage
    }
  }

  getConfig(): Readonly<PomodoroTimerConfig> {
    return this.config
  }

  start() {
    if (this.isRunning) {
      return
    }

    const timerUnit = new Duration({ milliseconds: 100 })

    this.scheduler.scheduleTask(() => {
      this.advanceTime(timerUnit)
      if (this.remaining.totalMilliseconds % 1000 === 0) {
        this.publishTimerUpdate()
      }
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

  subscribeTimerUpdate(callback: (update: PomodoroTimerUpdate) => void) {
    return this.timerUpdateSubscriptionManager.subscribe(callback)
  }

  unsubscribeTimerUpdate(subscriptionId: number) {
    this.timerUpdateSubscriptionManager.unsubscribe(subscriptionId)
  }

  getSubscriptionCount() {
    return this.timerUpdateSubscriptionManager.getSubscriptionCount()
  }

  setOnStageTransit(callback: () => void) {
    this.onStageTransit = callback
  }

  private publishTimerUpdate() {
    this.timerUpdateSubscriptionManager.publish({
      remainingSeconds: this.remaining.remainingSeconds(),
      isRunning: this.isRunning,
      stage: this.stage
    })
  }

  private transit() {
    if (this.stage === PomodoroStage.FOCUS) {
      this.handleFocusComplete()
    } else {
      this.handleBreakComplete()
    }
    this.onStageTransit()
  }

  private handleFocusComplete() {
    this.numOfFocusCompleted++

    if (this.numOfFocusCompleted === this.config.numOfFocusPerCycle) {
      this.numOfFocusCompleted = 0
      this.transitToLongBreak()
    } else {
      this.transitToShortBreak()
    }
  }

  private handleBreakComplete() {
    this.transitToFocus()
  }

  private transitToLongBreak() {
    this.stage = PomodoroStage.LONG_BREAK
    this.remaining = this.config.longBreakDuration
  }

  private transitToShortBreak() {
    this.stage = PomodoroStage.SHORT_BREAK
    this.remaining = this.config.shortBreakDuration
  }

  private transitToFocus() {
    this.stage = PomodoroStage.FOCUS
    this.remaining = this.config.focusDuration
  }
}

class SubscriptionManager<Arguments> {
  private callbackMap = new Map<number, (args: Arguments) => void>()

  subscribe(callback: (args: Arguments) => void) {
    const subscriptionId = this.getSubscriptionCount() + 1
    this.callbackMap.set(subscriptionId, callback)
    return subscriptionId
  }

  unsubscribe(subscriptionId: number) {
    this.callbackMap.delete(subscriptionId)
  }

  publish(args: Arguments) {
    this.callbackMap.forEach((callback) => {
      callback(args)
    })
  }

  getSubscriptionCount() {
    return this.callbackMap.size
  }
}

export type PomodoroTimerState = {
  remaining: Duration
  isRunning: boolean
  stage: PomodoroStage
}

export type PomodoroTimerUpdate = {
  remainingSeconds: number
  isRunning: boolean
  stage: PomodoroStage
}
