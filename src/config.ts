import { Duration } from './domain/pomodoro/duration'

const getBlockedTemplateUrl = () => {
  return chrome.runtime.getURL('blocked.html')
}

const getFocusDuration = () => {
  return new Duration({ minutes: 25 })
}

export default {
  getBlockedTemplateUrl,
  getFocusDuration
}
