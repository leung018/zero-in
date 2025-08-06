import config from '../../config'
import { PeriodicTaskScheduler } from '../../infra/scheduler'
import { getDateAfter } from '../../utils/date'
import type { TimerConfig } from './config'
import { Duration } from './duration'
import { TimerStage } from './stage'
import type { TimerExternalState } from './state/external'

export class FocusTimer {
  static create(timerConfig: TimerConfig = config.getDefaultTimerConfig()) {
    return new FocusTimer({
      timerConfig
    })
  }

  private timerStatePayload: TimerStatePayload

  private config: TimerConfig

  private scheduler = new PeriodicTaskScheduler()

  private onStageCompleted: (lastStage: TimerStage) => void = () => {}

  private onTimerUpdate: (state: TimerExternalState) => void = () => {}

  private onTimerStart: () => void = () => {}

  private constructor({ timerConfig }: { timerConfig: TimerConfig }) {
    this.config = this.newInternalConfig(timerConfig)
    const now = new Date()
    this.timerStatePayload = new TimerStatePayload({
      pausedAt: now,
      endAt: getDateAfter(now, timerConfig.focusDuration),
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

  getState(): Readonly<TimerExternalState> {
    return this.timerStatePayload.toTimerState()
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
    return this.timerStatePayload.remaining()
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

    this.scheduler.scheduleTask(
      () => {
        if (this.remaining().isZero()) {
          this.stopRunning()
          this.completeCurrentStage()
        }
        this.notifyTimerUpdate()
      },
      { intervalMs: 1000, startAfterMs: this.getMsUntilNextSecond() }
    )

    this.timerStatePayload = this.timerStatePayload.withUpdate({
      pausedAt: undefined,
      endAt: getDateAfter(
        new Date(),
        dateDiff(this.timerStatePayload.pausedAt, this.timerStatePayload.endAt)
      )
    })

    this.onTimerStart()
    this.notifyTimerUpdate()
  }

  private getMsUntilNextSecond() {
    return this.remaining().totalMilliseconds % 1000
  }

  pause() {
    this.stopRunning()
    this.notifyTimerUpdate()
  }

  private stopRunning() {
    this.timerStatePayload = this.timerStatePayload.withUpdate({
      pausedAt: new Date()
    })
    this.scheduler.stopTask()
  }

  setOnTimerStart(callback: () => void) {
    this.onTimerStart = callback
  }

  setOnTimerUpdate(callback: (state: TimerExternalState) => void) {
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
    this.timerStatePayload = this.timerStatePayload
      .pausedWith(this.config.longBreakDuration)
      .withUpdate({
        stage: TimerStage.LONG_BREAK
      })
  }

  private setToBeginOfShortBreak() {
    this.timerStatePayload = this.timerStatePayload
      .pausedWith(this.config.shortBreakDuration)
      .withUpdate({
        stage: TimerStage.SHORT_BREAK
      })
  }

  private setToBeginOfFocus() {
    this.timerStatePayload = this.timerStatePayload
      .pausedWith(this.config.focusDuration)
      .withUpdate({
        stage: TimerStage.FOCUS
      })
  }

  setState(state: TimerExternalState) {
    this.timerStatePayload = this.timerStatePayload.pausedWith(state.remaining).withUpdate({
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

class TimerStatePayload {
  readonly pausedAt?: Date
  readonly endAt: Date
  readonly stage: TimerStage
  readonly focusSessionsCompleted: number

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

  toTimerState(now = new Date()): TimerExternalState {
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

  pausedWith(remaining: Duration): TimerStatePayload {
    const now = new Date()
    return new TimerStatePayload({
      ...this,
      pausedAt: now,
      endAt: getDateAfter(now, remaining)
    })
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
