import { TimerBasedBlockingRules } from './domain/timer-based-blocking'
import { TimerConfig } from './domain/timer/config'
import { Duration } from './domain/timer/duration'

const getDefaultTimerBasedBlockingRules = (): TimerBasedBlockingRules => {
  return {
    pauseBlockingDuringBreaks: true,
    pauseBlockingWhenTimerNotRunning: false
  }
}

const getDefaultTimerConfig = () => {
  return new TimerConfig({
    focusDuration: new Duration({ minutes: 26 }),
    shortBreakDuration: new Duration({ minutes: 5 }),
    longBreakDuration: new Duration({ minutes: 19 }),
    focusSessionsPerCycle: 4
  })
}

export default {
  getDefaultTimerBasedBlockingRules,
  getDefaultTimerConfig
}
