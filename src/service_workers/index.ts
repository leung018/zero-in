import { RedirectTogglingService } from '../domain/redirect_toggling'

const redirectTogglingService = RedirectTogglingService.create()

chrome.alarms.create('redirectRules', { periodInMinutes: 0.01 }) // TODO: Set it to 0.5 in production
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'redirectRules') {
    redirectTogglingService.run()
  }
})
