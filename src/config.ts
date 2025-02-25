import type { PomodoroTimerConfig } from './domain/pomodoro/config'
import { Duration } from './domain/pomodoro/duration'

const getBlockedTemplateUrl = () => {
  return chrome.runtime.getURL('blocked.html')
}

const getPomodoroTimerConfig = (): PomodoroTimerConfig => {
  return {
    focusDuration: new Duration({ minutes: 25 }),
    shortBreakDuration: new Duration({ minutes: 5 })
  }
}

export default {
  getPomodoroTimerConfig,
  getBlockedTemplateUrl
}
