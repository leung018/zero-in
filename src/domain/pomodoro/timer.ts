import config from '../../config'
import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  type PeriodicTaskScheduler
} from '../../infra/scheduler'
import type { PomodoroTimerConfig } from './config'
import { Duration } from './duration'
import { newPomodoroRecord } from './record'
import { PomodoroRecordHousekeeper } from './record/house_keep'
import { PomodoroRecordStorageService } from './record/storage'
import { PomodoroStage } from './stage'

export class PomodoroTimer {
  static create() {
    return new PomodoroTimer({
      scheduler: new PeriodicTaskSchedulerImpl(),
      timerConfig: config.getPomodoroTimerConfig(),
      pomodoroRecordStorageService: PomodoroRecordStorageService.create()
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    pomodoroRecordStorageService = PomodoroRecordStorageService.createFake(),
    timerConfig = config.getPomodoroTimerConfig()
  } = {}) {
    return new PomodoroTimer({
      timerConfig,
      pomodoroRecordStorageService,
      scheduler
    })
  }

  private stage: PomodoroStage = PomodoroStage.FOCUS

  private config: PomodoroTimerConfig

  private isRunning: boolean = false

  private remaining: Duration

  private numOfPomodoriCompleted: number = 0

  private scheduler: PeriodicTaskScheduler

  private pomodoroRecordStorageService: PomodoroRecordStorageService

  private timerStateSubscriptionManager = new SubscriptionManager<PomodoroTimerState>()

  private pomodoroRecordsUpdateSubscriptionManager = new SubscriptionManager()

  private onStageComplete: () => void = () => {}

  private constructor({
    timerConfig,
    scheduler,
    pomodoroRecordStorageService
  }: {
    timerConfig: PomodoroTimerConfig
    scheduler: PeriodicTaskScheduler
    pomodoroRecordStorageService: PomodoroRecordStorageService
  }) {
    this.config = {
      ...timerConfig,
      focusDuration: this.roundUpToSeconds(timerConfig.focusDuration),
      shortBreakDuration: this.roundUpToSeconds(timerConfig.shortBreakDuration),
      longBreakDuration: this.roundUpToSeconds(timerConfig.longBreakDuration)
    }
    this.remaining = timerConfig.focusDuration
    this.scheduler = scheduler
    this.pomodoroRecordStorageService = pomodoroRecordStorageService
  }

  private roundUpToSeconds(duration: Duration): Duration {
    return new Duration({
      seconds: duration.remainingSeconds()
    })
  }

  getState(): Readonly<PomodoroTimerState> {
    return {
      remainingSeconds: this.remaining.remainingSeconds(),
      isRunning: this.isRunning,
      stage: this.stage,
      numOfPomodoriCompleted: this.numOfPomodoriCompleted
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
        this.broadcastTimerState()
      }
    }, timerUnit.totalMilliseconds)
    this.isRunning = true
    this.broadcastTimerState()
  }

  pause() {
    this.stopRunning()
    this.broadcastTimerState()
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

  subscribeTimerState(callback: (state: PomodoroTimerState) => void) {
    const subscriptionId = this.timerStateSubscriptionManager.subscribe(callback)
    this.timerStateSubscriptionManager.publish(this.getState(), subscriptionId)
    return subscriptionId
  }

  unsubscribeTimerState(subscriptionId: number) {
    this.timerStateSubscriptionManager.unsubscribe(subscriptionId)
  }

  getSubscriptionCount() {
    return this.timerStateSubscriptionManager.getSubscriptionCount()
  }

  setOnStageComplete(callback: () => void) {
    this.onStageComplete = callback
  }

  subscribePomodoroRecordsUpdate(callback: () => void) {
    const subscriptionId = this.pomodoroRecordsUpdateSubscriptionManager.subscribe(callback)
    return subscriptionId
  }

  unsubscribePomodoroRecordsUpdate(subscriptionId: number) {
    return this.pomodoroRecordsUpdateSubscriptionManager.unsubscribe(subscriptionId)
  }

  restartShortBreak(nth?: number) {
    if (nth != null) {
      this.resetNumOfPomodoriCompleted(nth)
    }
    this.restart({ stage: PomodoroStage.SHORT_BREAK })
  }

  restartLongBreak() {
    this.restart({ stage: PomodoroStage.LONG_BREAK })
  }

  restartFocus(nth?: number) {
    if (nth != null) {
      this.resetNumOfPomodoriCompleted(nth - 1)
    }
    this.restart({ stage: PomodoroStage.FOCUS })
  }

  private resetNumOfPomodoriCompleted(n: number) {
    const upperLimit = this.config.numOfPomodoriPerCycle - 1
    n = Math.min(upperLimit, n)
    n = Math.max(0, n)
    this.numOfPomodoriCompleted = n
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

  private broadcastTimerState() {
    this.timerStateSubscriptionManager.broadcast(this.getState())
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
    this.numOfPomodoriCompleted++
    this.updatePomodoroRecords()

    if (this.numOfPomodoriCompleted >= this.config.numOfPomodoriPerCycle) {
      this.setToBeginOfLongBreak()
    } else {
      this.setToBeginOfShortBreak()
    }
  }

  private async updatePomodoroRecords() {
    return this.pomodoroRecordStorageService
      .getAll()
      .then((records) => {
        this.pomodoroRecordStorageService.saveAll([...records, newPomodoroRecord()])
      })
      .then(() => {
        PomodoroRecordHousekeeper.houseKeep({
          pomodoroRecordStorageService: this.pomodoroRecordStorageService,
          houseKeepDays: this.config.pomodoroRecordHouseKeepDays
        })
      })
      .then(() => {
        this.pomodoroRecordsUpdateSubscriptionManager.broadcast(undefined)
      })
  }

  private handleBreakComplete() {
    if (this.stage === PomodoroStage.LONG_BREAK) {
      this.numOfPomodoriCompleted = 0
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

  setState(state: PomodoroTimerState) {
    this.remaining = new Duration({ seconds: state.remainingSeconds })
    this.stage = state.stage
    this.numOfPomodoriCompleted = state.numOfPomodoriCompleted

    if (state.isRunning) {
      this.start()
    }
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
  remainingSeconds: number
  isRunning: boolean
  stage: PomodoroStage
  numOfPomodoriCompleted: number
}
