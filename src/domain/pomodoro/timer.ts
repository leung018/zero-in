import config from '../../config'
import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  type PeriodicTaskScheduler
} from '../../infra/scheduler'
import type { TimerConfig } from './config'
import { Duration } from './duration'
import { PomodoroStage } from './stage'
import type { TimerState } from './state'

export class PomodoroTimer {
  static create(timerConfig: TimerConfig = config.getDefaultTimerConfig()) {
    return new PomodoroTimer({
      scheduler: new PeriodicTaskSchedulerImpl(),
      timerConfig
    })
  }

  static createFake({
    scheduler = new FakePeriodicTaskScheduler(),
    timerConfig = config.getDefaultTimerConfig()
  }: {
    scheduler?: PeriodicTaskScheduler
    timerConfig?: TimerConfig
  } = {}) {
    return new PomodoroTimer({
      timerConfig,
      scheduler
    })
  }

  private stage: PomodoroStage = PomodoroStage.FOCUS

  private config: TimerConfig

  private isRunning: boolean = false

  private remaining: Duration

  private numOfPomodoriCompleted: number = 0

  private scheduler: PeriodicTaskScheduler

  private onStageComplete: (stage: PomodoroStage) => void = () => {}

  private onTimerUpdate: (state: TimerState) => void = () => {}

  private constructor({
    timerConfig,
    scheduler
  }: {
    timerConfig: TimerConfig
    scheduler: PeriodicTaskScheduler
  }) {
    this.config = this.newInternalConfig(timerConfig)
    this.remaining = timerConfig.focusDuration
    this.scheduler = scheduler
  }

  private newInternalConfig(config: TimerConfig): TimerConfig {
    return {
      ...config,
      focusDuration: this.roundUpToSeconds(config.focusDuration),
      shortBreakDuration: this.roundUpToSeconds(config.shortBreakDuration),
      longBreakDuration: this.roundUpToSeconds(config.longBreakDuration)
    }
  }

  private roundUpToSeconds(duration: Duration): Duration {
    return new Duration({
      seconds: duration.remainingSeconds()
    })
  }

  getState(): Readonly<TimerState> {
    return {
      remainingSeconds: this.remaining.remainingSeconds(),
      isRunning: this.isRunning,
      stage: this.stage,
      numOfPomodoriCompleted: this.numOfPomodoriCompleted
    }
  }

  getConfig(): Readonly<TimerConfig> {
    return this.config
  }

  setConfig(config: TimerConfig) {
    this.config = this.newInternalConfig(config)
    this.setState({
      remainingSeconds: this.config.focusDuration.remainingSeconds(),
      isRunning: false,
      stage: PomodoroStage.FOCUS,
      numOfPomodoriCompleted: 0
    })
  }

  start() {
    if (this.isRunning) {
      return
    }

    const timerUnit = new Duration({ milliseconds: 100 })

    this.scheduler.scheduleTask(() => {
      this.advanceTime(timerUnit)
      if (this.remaining.totalMilliseconds % 1000 === 0) {
        this.notifyTimerUpdate()
      }
    }, timerUnit.totalMilliseconds)
    this.isRunning = true
    this.notifyTimerUpdate()
  }

  pause() {
    this.stopRunning()
    this.notifyTimerUpdate()
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

  setOnTimerUpdate(callback: (state: TimerState) => void) {
    this.onTimerUpdate = callback
    this.notifyTimerUpdate()
  }

  setOnStageComplete(callback: (completedStage: PomodoroStage) => void) {
    this.onStageComplete = callback
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
    const upperLimit = this.config.focusSessionsPerCycle - 1
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

  private notifyTimerUpdate() {
    this.onTimerUpdate(this.getState())
  }

  private completeCurrentStage() {
    this.onStageComplete(this.stage)
    if (this.stage === PomodoroStage.FOCUS) {
      this.handleFocusComplete()
    } else {
      this.handleBreakComplete()
    }
  }

  private handleFocusComplete() {
    this.numOfPomodoriCompleted++

    if (this.numOfPomodoriCompleted >= this.config.focusSessionsPerCycle) {
      this.setToBeginOfLongBreak()
    } else {
      this.setToBeginOfShortBreak()
    }
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

  setState(state: TimerState) {
    this.remaining = new Duration({ seconds: state.remainingSeconds })
    this.stage = state.stage
    this.numOfPomodoriCompleted = state.numOfPomodoriCompleted

    if (state.isRunning) {
      this.start()
    } else {
      this.pause()
    }
  }
}
