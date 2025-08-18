import config from '../../config'
import { PeriodicTaskScheduler } from '../../infra/scheduler'
import { TimerConfig } from './config'
import { Duration } from './duration'
import { TimerStage } from './stage'
import type { TimerExternalState } from './state/external'
import { TimerInternalState } from './state/internal'

type OnStageCompletedArgs = {
  lastStage: TimerStage
  lastSessionStartTime: Date
}

export class FocusTimer {
  static create(timerConfig: TimerConfig = config.getDefaultTimerConfig()) {
    return new FocusTimer({
      timerConfig
    })
  }

  private internalState: TimerInternalState

  private config: TimerConfig

  private scheduler = new PeriodicTaskScheduler()

  private onStageCompleted: (args: OnStageCompletedArgs) => void = () => {}

  private onTimerUpdate: (state: TimerExternalState) => void = () => {}

  private onTimerStart: () => void = () => {}

  private onTimerPause: () => void = () => {}

  private constructor({ timerConfig }: { timerConfig: TimerConfig }) {
    this.config = this.newInternalConfig(timerConfig)
    this.internalState = TimerInternalState.newPausedState({
      timerId: crypto.randomUUID(),
      remaining: this.config.focusDuration,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })
  }

  private newInternalConfig(config: TimerConfig): TimerConfig {
    return new TimerConfig({
      ...config,
      focusDuration: this.roundUpToSeconds(config.focusDuration),
      shortBreakDuration: this.roundUpToSeconds(config.shortBreakDuration),
      longBreakDuration: this.roundUpToSeconds(config.longBreakDuration)
    })
  }

  private roundUpToSeconds(duration: Duration): Duration {
    return new Duration({
      seconds: duration.remainingSeconds()
    })
  }

  getExternalState(): Readonly<TimerExternalState> {
    return this.internalState.toExternalState()
  }

  getInternalState(): Readonly<TimerInternalState> {
    return this.internalState
  }

  getConfig(): Readonly<TimerConfig> {
    return this.config
  }

  getId() {
    return this.internalState.timerId
  }

  setConfig(config: TimerConfig) {
    this.config = this.newInternalConfig(config)
    this.setInternalState(
      TimerInternalState.newPausedState({
        timerId: this.internalState.timerId,
        remaining: this.config.focusDuration,
        stage: TimerStage.FOCUS,
        focusSessionsCompleted: 0
      })
    )
  }

  private remaining() {
    return this.internalState.remaining()
  }

  private stage() {
    return this.internalState.stage
  }

  private focusSessionsCompleted() {
    return this.internalState.focusSessionsCompleted
  }

  start() {
    this.scheduler.stopTask()

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

    if (this.internalState.pausedAt) {
      this.internalState = this.internalState.copyAsRunningWith(this.remaining())
    }

    if (!this.internalState.sessionStartTime) {
      this.internalState = this.internalState.copyWith({
        sessionStartTime: new Date()
      })
    }

    this.onTimerStart()
    this.notifyTimerUpdate()
  }

  private getMsUntilNextSecond() {
    return this.remaining().totalMilliseconds % 1000
  }

  pause() {
    this.stopRunning()
    this.onTimerPause()
    this.notifyTimerUpdate()
  }

  private stopRunning() {
    if (this.internalState.isRunning()) {
      this.internalState = this.internalState.copyAsPausedNow()
    }
    this.scheduler.stopTask()
  }

  setOnTimerStart(callback: () => void) {
    this.onTimerStart = callback
  }

  setOnTimerPause(callback: () => void) {
    this.onTimerPause = callback
  }

  setOnTimerUpdate(callback: (state: TimerExternalState) => void) {
    this.onTimerUpdate = callback
    this.notifyTimerUpdate()
  }

  setOnStageCompleted(callback: (args: OnStageCompletedArgs) => void) {
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
    this.internalState = this.internalState.copyWith({
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
    this.onTimerUpdate(this.getExternalState())
  }

  private completeCurrentStage() {
    const lastStage = this.stage()
    const lastSessionStartTime = this.internalState.sessionStartTime ?? new Date() // Defensive fallback - sessionStartTime should always exist when timer is running
    if (this.stage() === TimerStage.FOCUS) {
      this.handleFocusComplete()
    } else {
      this.handleBreakComplete()
    }
    this.onStageCompleted({
      lastStage,
      lastSessionStartTime
    })
  }

  private handleFocusComplete() {
    this.internalState = this.internalState.copyWith({
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
      this.internalState = this.internalState.copyWith({
        focusSessionsCompleted: 0
      })
    }
    this.setToBeginOfFocus()
  }

  private setToBeginOfLongBreak() {
    this.internalState = this.internalState
      .copyAsResetWith(this.config.longBreakDuration)
      .copyWith({
        stage: TimerStage.LONG_BREAK
      })
  }

  private setToBeginOfShortBreak() {
    this.internalState = this.internalState
      .copyAsResetWith(this.config.shortBreakDuration)
      .copyWith({
        stage: TimerStage.SHORT_BREAK
      })
  }

  private setToBeginOfFocus() {
    this.internalState = this.internalState.copyAsResetWith(this.config.focusDuration).copyWith({
      stage: TimerStage.FOCUS
    })
  }

  setInternalState(update: {
    sessionStartTime: Date | null
    pausedAt: Date | null
    endAt: Date
    stage: TimerStage
    focusSessionsCompleted: number
  }) {
    this.internalState = this.internalState.copyWith(update)

    if (this.internalState.isRunning()) {
      this.start()
    } else {
      this.pause()
    }
  }
}
