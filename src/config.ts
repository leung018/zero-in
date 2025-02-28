import type { PomodoroTimerConfig } from './domain/pomodoro/config'
import { Duration } from './domain/pomodoro/duration'
import type { BadgeColor } from './infra/badge'

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

const getBadgeColorConfig = (): {
  focusBadgeColor: BadgeColor
  breakBadgeColor: BadgeColor
} => {
  return {
    focusBadgeColor: {
      textColor: '#ffffff',
      backgroundColor: '#ff0000'
    },
    breakBadgeColor: {
      textColor: '#ffffff',
      backgroundColor: '#add8e6'
    }
  }
}

export default {
  getPomodoroTimerConfig,
  getBlockedTemplateUrl,
  getBadgeColorConfig
}
