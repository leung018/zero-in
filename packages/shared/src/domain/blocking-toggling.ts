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
