import config from '../../config'
import { CurrentDateService } from '../../infra/current_date'
import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  type PeriodicTaskScheduler
} from '../../infra/scheduler'
import { FakeClock } from '../../utils/clock'
import { getDateAfter } from '../../utils/date'
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

  private timerStatePayload: TimerStatePayload

  private config: TimerConfig

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
    this.scheduler = scheduler
    this.currentDateService = currentDateService
    this.timerStatePayload = new TimerStatePayload({
      pausedAt: currentDateService.getDate(),
      endAt: getDateAfter(currentDateService.getDate(), timerConfig.focusDuration),
      focusSessionsCompleted: 0,
      stage: TimerStage.FOCUS
    })
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
    return this.timerStatePayload.toTimerState(this.currentDateService.getDate())
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

  private remaining() {
    return this.timerStatePayload.remaining(this.currentDateService.getDate())
  }

  private stage() {
    return this.timerStatePayload.stage
  }

  private focusSessionsCompleted() {
    return this.timerStatePayload.focusSessionsCompleted
  }

  start() {
    if (!this.timerStatePayload.pausedAt) {
      return
    }

    this.scheduler.scheduleTask(() => {
      if (this.remaining().isZero()) {
        this.stopRunning()
        this.completeCurrentStage()
      }
      if (this.remaining().totalMilliseconds % FocusTimer.NOTIFY_INTERVAL.totalMilliseconds === 0) {
        this.notifyTimerUpdate()
      }
    }, FocusTimer.TIMER_UNIT.totalMilliseconds)

    this.timerStatePayload = this.timerStatePayload.withUpdate({
      pausedAt: undefined,
      endAt: getDateAfter(
        this.currentDateService.getDate(),
        dateDiff(this.timerStatePayload.pausedAt, this.timerStatePayload.endAt)
      )
    })

    this.onTimerStart()
    this.notifyTimerUpdate()
  }

  pause() {
    this.stopRunning()
    this.notifyTimerUpdate()
  }

  private stopRunning() {
    this.timerStatePayload = this.timerStatePayload.withUpdate({
      pausedAt: this.currentDateService.getDate()
    })
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
    this.timerStatePayload = this.timerStatePayload.withUpdate({
      focusSessionsCompleted: n
    })
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
    const lastStage = this.stage()
    if (this.stage() === TimerStage.FOCUS) {
      this.handleFocusComplete()
    } else {
      this.handleBreakComplete()
    }
    this.onStageCompleted(lastStage)
  }

  private handleFocusComplete() {
    this.timerStatePayload = this.timerStatePayload.withUpdate({
      focusSessionsCompleted: this.focusSessionsCompleted() + 1
    })

    if (this.focusSessionsCompleted() >= this.config.focusSessionsPerCycle) {
      this.setToBeginOfLongBreak()
    } else {
      this.setToBeginOfShortBreak()
    }
  }

  private handleBreakComplete() {
    if (this.stage() === TimerStage.LONG_BREAK) {
      this.timerStatePayload = this.timerStatePayload.withUpdate({
        focusSessionsCompleted: 0
      })
    }
    this.setToBeginOfFocus()
  }

  private setToBeginOfLongBreak() {
    this.timerStatePayload = this.timerStatePayload.withUpdate({
      stage: TimerStage.LONG_BREAK,
      endAt: getDateAfter(this.currentDateService.getDate(), this.config.longBreakDuration),
      pausedAt: this.currentDateService.getDate()
    })
  }

  private setToBeginOfShortBreak() {
    this.timerStatePayload = this.timerStatePayload.withUpdate({
      stage: TimerStage.SHORT_BREAK,
      endAt: getDateAfter(this.currentDateService.getDate(), this.config.shortBreakDuration),
      pausedAt: this.currentDateService.getDate()
    })
  }

  private setToBeginOfFocus() {
    this.timerStatePayload = this.timerStatePayload.withUpdate({
      stage: TimerStage.FOCUS,
      endAt: getDateAfter(this.currentDateService.getDate(), this.config.focusDuration),
      pausedAt: this.currentDateService.getDate()
    })
  }

  setState(state: TimerState) {
    this.timerStatePayload = new TimerStatePayload({
      pausedAt: this.currentDateService.getDate(),
      endAt: getDateAfter(this.currentDateService.getDate(), state.remaining),
      stage: state.stage,
      focusSessionsCompleted: state.focusSessionsCompleted
    })

    if (state.isRunning) {
      this.start()
    } else {
      this.pause()
    }
  }
}

export class TimerStatePayload {
  pausedAt?: Date
  endAt: Date
  stage: TimerStage
  focusSessionsCompleted: number

  constructor({
    pausedAt,
    endAt,
    stage,
    focusSessionsCompleted
  }: {
    pausedAt?: Date
    endAt: Date
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    this.pausedAt = pausedAt
    this.endAt = endAt
    this.stage = stage
    this.focusSessionsCompleted = focusSessionsCompleted
  }

  toTimerState(now = new Date()): TimerState {
    return {
      remaining: this.remaining(now),
      stage: this.stage,
      focusSessionsCompleted: this.focusSessionsCompleted,
      isRunning: this.isRunning()
    }
  }

  remaining(now: Date = new Date()): Duration {
    if (this.pausedAt === undefined) {
      return dateDiff(now, this.endAt)
    }
    return dateDiff(this.pausedAt, this.endAt)
  }

  isRunning(): boolean {
    return this.pausedAt === undefined
  }

  withUpdate(update: Partial<TimerStatePayload>): TimerStatePayload {
    return new TimerStatePayload({ ...this, ...update })
  }
}

function dateDiff(start: Date, end: Date): Duration {
  if (start.getTime() > end.getTime()) {
    return new Duration({ milliseconds: 0 })
  }

  return new Duration({
    milliseconds: end.getTime() - start.getTime()
  })
}
