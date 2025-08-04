import config from '../../config'
import { CurrentDateService } from '../../infra/current_date'
import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  type PeriodicTaskScheduler
} from '../../infra/scheduler'
import { FakeClock } from '../../utils/clock'
import type { TimerConfig } from './config'
import { Duration } from './duration'
import { TimerStage } from './stage'
import type { TimerState } from './state'

export class FocusTimer {
  /**
   * Smallest unit of time that the timer can measure.
   */
  static readonly TIMER_UNIT: Duration = new Duration({ milliseconds: 100 })

  /**
   * Interval at which the timer will notify other about the current state.
   */
  static readonly NOTIFY_INTERVAL: Duration = new Duration({ seconds: 1 })

  static create(timerConfig: TimerConfig = config.getDefaultTimerConfig()) {
    return new FocusTimer({
      currentDateService: CurrentDateService.create(),
      scheduler: new PeriodicTaskSchedulerImpl(),
      timerConfig
    })
  }

  static createFake({
    stubbedDate = new Date(),
    fakeClock = new FakeClock(),
    timerConfig = config.getDefaultTimerConfig()
  } = {}) {
    const scheduler = new FakePeriodicTaskScheduler(fakeClock)
    const currentDateService = CurrentDateService.createFake({ stubbedDate, fakeClock })

    return new FocusTimer({
      timerConfig,
      scheduler,
      currentDateService
    })
  }

  private stage: TimerStage = TimerStage.FOCUS

  private config: TimerConfig

  private isRunning: boolean = false

  private remaining: Duration

  private focusSessionsCompleted: number = 0

  private scheduler: PeriodicTaskScheduler

  private currentDateService: CurrentDateService

  private onStageCompleted: (lastStage: TimerStage) => void = () => {}

  private onTimerUpdate: (state: TimerState) => void = () => {}

  private onTimerStart: () => void = () => {}

  private constructor({
    currentDateService,
    timerConfig,
    scheduler
  }: {
    currentDateService: CurrentDateService
    timerConfig: TimerConfig
    scheduler: PeriodicTaskScheduler
  }) {
    this.config = this.newInternalConfig(timerConfig)
    this.remaining = timerConfig.focusDuration
    this.scheduler = scheduler
    this.currentDateService = currentDateService
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
      remaining: this.remaining,
      isRunning: this.isRunning,
      stage: this.stage,
      focusSessionsCompleted: this.focusSessionsCompleted
    }
  }

  getConfig(): Readonly<TimerConfig> {
    return this.config
  }

  setConfig(config: TimerConfig) {
    this.config = this.newInternalConfig(config)
    this.setState({
      remaining: this.config.focusDuration,
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })
  }

  start() {
    if (this.isRunning) {
      return
    }

    this.scheduler.scheduleTask(() => {
      this.advanceTime(FocusTimer.TIMER_UNIT)
      if (this.remaining.totalMilliseconds % FocusTimer.NOTIFY_INTERVAL.totalMilliseconds === 0) {
        this.notifyTimerUpdate()
      }
    }, FocusTimer.TIMER_UNIT.totalMilliseconds)
    this.isRunning = true

    this.onTimerStart()
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

  setOnTimerStart(callback: () => void) {
    this.onTimerStart = callback
  }

  setOnTimerUpdate(callback: (state: TimerState) => void) {
    this.onTimerUpdate = callback
    this.notifyTimerUpdate()
  }

  setOnStageCompleted(callback: (lastStage: TimerStage) => void) {
    this.onStageCompleted = callback
  }

  restartShortBreak(nth?: number) {
    if (nth != null) {
      this.resetFocusSessionsCompleted(nth)
    }
    this.restart({ stage: TimerStage.SHORT_BREAK })
  }

  restartLongBreak() {
    this.restart({ stage: TimerStage.LONG_BREAK })
  }

  restartFocus(nth?: number) {
    if (nth != null) {
      this.resetFocusSessionsCompleted(nth - 1)
    }
    this.restart({ stage: TimerStage.FOCUS })
  }

  private resetFocusSessionsCompleted(n: number) {
    const upperLimit = this.config.focusSessionsPerCycle - 1
    n = Math.min(upperLimit, n)
    n = Math.max(0, n)
    this.focusSessionsCompleted = n
  }

  private restart({ stage }: { stage: TimerStage }) {
    this.stopRunning()
    switch (stage) {
      case TimerStage.FOCUS:
        this.setToBeginOfFocus()
        break
      case TimerStage.SHORT_BREAK:
        this.setToBeginOfShortBreak()
        break
      case TimerStage.LONG_BREAK:
        this.setToBeginOfLongBreak()
        break
    }
    this.start()
  }

  private notifyTimerUpdate() {
    this.onTimerUpdate(this.getState())
  }

  private completeCurrentStage() {
    const lastStage = this.stage
    if (this.stage === TimerStage.FOCUS) {
      this.handleFocusComplete()
    } else {
      this.handleBreakComplete()
    }
    this.onStageCompleted(lastStage)
  }

  private handleFocusComplete() {
    this.focusSessionsCompleted++

    if (this.focusSessionsCompleted >= this.config.focusSessionsPerCycle) {
      this.setToBeginOfLongBreak()
    } else {
      this.setToBeginOfShortBreak()
    }
  }

  private handleBreakComplete() {
    if (this.stage === TimerStage.LONG_BREAK) {
      this.focusSessionsCompleted = 0
    }
    this.setToBeginOfFocus()
  }

  private setToBeginOfLongBreak() {
    this.stage = TimerStage.LONG_BREAK
    this.remaining = this.config.longBreakDuration
  }

  private setToBeginOfShortBreak() {
    this.stage = TimerStage.SHORT_BREAK
    this.remaining = this.config.shortBreakDuration
  }

  private setToBeginOfFocus() {
    this.stage = TimerStage.FOCUS
    this.remaining = this.config.focusDuration
  }

  setState(state: TimerState) {
    this.remaining = new Duration({ milliseconds: state.remaining.totalMilliseconds })
    this.stage = state.stage
    this.focusSessionsCompleted = state.focusSessionsCompleted

    if (state.isRunning) {
      this.start()
    } else {
      this.pause()
    }
  }
}
