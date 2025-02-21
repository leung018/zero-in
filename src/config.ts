import { Duration } from './domain/pomodoro/duration'

const getBlockedTemplateUrl = () => {
  return chrome.runtime.getURL('blocked.html')
}

const getFocusDuration = () => {
  return new Duration({ minutes: 25 })
}

const getRestDuration = () => {
  return new Duration({ minutes: 5 })
}

export default {
  getBlockedTemplateUrl,
  getFocusDuration,
  getRestDuration
}
