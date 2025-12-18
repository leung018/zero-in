import { TimerBasedBlockingRules } from './domain/timer-based-blocking'

const getDefaultTimerBasedBlockingRules = (): TimerBasedBlockingRules => {
  return {
    pauseBlockingDuringBreaks: true,
    pauseBlockingWhenTimerNotRunning: false
  }
}

export default {
  getDefaultTimerBasedBlockingRules
}
