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
      timerConfig: config.getPomodoroTimerConfig()
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    timerConfig = config.getPomodoroTimerConfig()
  } = {}) {
    return new PomodoroTimer({
      timerConfig,
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

  private onStageComplete: () => void = () => {}

  private constructor({
    timerConfig,
    scheduler
  }: {
    timerConfig: PomodoroTimerConfig
    scheduler: PeriodicTaskScheduler
  }) {
    this.config = {
      ...timerConfig,
      focusDuration: this.roundUpToSeconds(timerConfig.focusDuration),
      shortBreakDuration: this.roundUpToSeconds(timerConfig.shortBreakDuration),
      longBreakDuration: this.roundUpToSeconds(timerConfig.longBreakDuration)
    }
    this.remaining = timerConfig.focusDuration
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
      stage: this.stage,
      numOfFocusCompleted: this.numOfFocusCompleted
    }
  }

  getUpdate(): PomodoroTimerUpdate {
    return {
      remainingSeconds: this.remaining.remainingSeconds(),
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
        this.broadcastTimerUpdate()
      }
    }, timerUnit.totalMilliseconds)
    this.isRunning = true
    this.broadcastTimerUpdate()
  }

  pause() {
    this.stopRunning()
    this.broadcastTimerUpdate()
  }

  private advanceTime(duration: Duration) {
    this.remaining = this.remaining.subtract(duration)
    if (this.remaining.isZero()) {
      this.stopRunning()
      this.completeCurrentStage()
    }
  }

  private stopRunning() {
    this.isRunning = false
    this.scheduler.stopTask()
  }

  subscribeTimerUpdate(callback: (update: PomodoroTimerUpdate) => void) {
    const subscriptionId = this.timerUpdateSubscriptionManager.subscribe(callback)
    this.timerUpdateSubscriptionManager.publish(this.getUpdate(), subscriptionId)
    return subscriptionId
  }

  unsubscribeTimerUpdate(subscriptionId: number) {
    this.timerUpdateSubscriptionManager.unsubscribe(subscriptionId)
  }

  getSubscriptionCount() {
    return this.timerUpdateSubscriptionManager.getSubscriptionCount()
  }

  setOnStageComplete(callback: () => void) {
    this.onStageComplete = callback
  }

  restartShortBreak(numOfFocusCompleted?: number) {
    if (numOfFocusCompleted) {
      this.resetNumOfFocusCompleted(numOfFocusCompleted)
    }
    this.restart({ stage: PomodoroStage.SHORT_BREAK })
  }

  restartLongBreak() {
    this.restart({ stage: PomodoroStage.LONG_BREAK })
  }

  restartFocus(nth?: number) {
    if (nth != null) {
      this.resetNumOfFocusCompleted(nth - 1)
    }
    this.restart({ stage: PomodoroStage.FOCUS })
  }

  private resetNumOfFocusCompleted(n: number) {
    const upperLimit = this.config.numOfFocusPerCycle - 1
    n = Math.min(upperLimit, n)
    n = Math.max(0, n)
    this.numOfFocusCompleted = n
  }

  private restart({ stage }: { stage: PomodoroStage }) {
    this.stopRunning()
    switch (stage) {
      case PomodoroStage.FOCUS:
        this.setToBeginOfFocus()
        break
      case PomodoroStage.SHORT_BREAK:
        this.setToBeginOfShortBreak()
        break
      case PomodoroStage.LONG_BREAK:
        this.setToBeginOfLongBreak()
        break
    }
    this.start()
  }

  private broadcastTimerUpdate() {
    this.timerUpdateSubscriptionManager.broadcast(this.getUpdate())
  }

  private completeCurrentStage() {
    if (this.stage === PomodoroStage.FOCUS) {
      this.handleFocusComplete()
    } else {
      this.handleBreakComplete()
    }
    this.onStageComplete()
  }

  private handleFocusComplete() {
    this.numOfFocusCompleted++

    if (this.numOfFocusCompleted >= this.config.numOfFocusPerCycle) {
      this.setToBeginOfLongBreak()
    } else {
      this.setToBeginOfShortBreak()
    }
  }

  private handleBreakComplete() {
    if (this.stage === PomodoroStage.LONG_BREAK) {
      this.numOfFocusCompleted = 0
    }
    this.setToBeginOfFocus()
  }

  private setToBeginOfLongBreak() {
    this.stage = PomodoroStage.LONG_BREAK
    this.remaining = this.config.longBreakDuration
  }

  private setToBeginOfShortBreak() {
    this.stage = PomodoroStage.SHORT_BREAK
    this.remaining = this.config.shortBreakDuration
  }

  private setToBeginOfFocus() {
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

  broadcast(args: Arguments) {
    this.callbackMap.forEach((callback) => {
      callback(args)
    })
  }

  publish(args: Arguments, subscriptionId: number) {
    const callback = this.callbackMap.get(subscriptionId)
    if (callback) {
      callback(args)
    }
  }

  getSubscriptionCount() {
    return this.callbackMap.size
  }
}

export type PomodoroTimerState = {
  remaining: Duration
  isRunning: boolean
  stage: PomodoroStage
  numOfFocusCompleted: number
}

export type PomodoroTimerUpdate = {
  remainingSeconds: number
  isRunning: boolean
  stage: PomodoroStage
}
