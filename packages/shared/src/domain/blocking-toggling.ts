import { Duration } from './timer/duration'
import { TimerStage } from './timer/stage'

/**
 * It is interface, which provides a method to retrieve timer information such as the current stage, remaining time, and break durations.
 * This allows both platforms to implement their own logic for determining when to toggle blocking based on the timer state.
 */
export interface TimerInfoGetter {
  getTimerInfo(): {
    timerStage: TimerStage
    isRunning: boolean
    remaining: Duration
    longBreak: Duration
    shortBreak: Duration
  }
}

export function isInBreak(timerInfo: ReturnType<TimerInfoGetter['getTimerInfo']>) {
  // Tests of this function is covered by browsing-control-toggling.spec.ts

  if (timerInfo.timerStage === TimerStage.FOCUS) {
    return false
  }
  if (timerInfo.isRunning) {
    return true
  }

  // If user hasn't pressed the start of the timer even the stage is break, still is not in break yet.
  if (
    timerInfo.timerStage === TimerStage.SHORT_BREAK &&
    timerInfo.shortBreak.totalMilliseconds <= timerInfo.remaining.totalMilliseconds
  ) {
    return false
  }
  if (
    timerInfo.timerStage === TimerStage.LONG_BREAK &&
    timerInfo.longBreak.totalMilliseconds <= timerInfo.remaining.totalMilliseconds
  ) {
    return false
  }
  return true
}
