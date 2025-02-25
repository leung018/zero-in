import type { PomodoroTimerConfig } from './domain/pomodoro/config'
import { Duration } from './domain/pomodoro/duration'

const getBlockedTemplateUrl = () => {
  return chrome.runtime.getURL('blocked.html')
}

const getPomodoroTimerConfig = (): PomodoroTimerConfig => {
  return {
    focusDuration: new Duration({ minutes: 25 }),
    shortBreakDuration: new Duration({ minutes: 5 }),
    longBreakDuration: new Duration({ minutes: 15 }),
    numOfFocusPerCycle: 4
  }
}

export default {
  getPomodoroTimerConfig,
  getBlockedTemplateUrl
}
