import { Duration } from './timer/duration'
import { TimerStage } from './timer/stage'

export interface TimerInfoGetter {
  getTimerInfo(): {
    timerStage: TimerStage
    isRunning: boolean
    remaining: Duration
    longBreak: Duration
    shortBreak: Duration
  }
}
