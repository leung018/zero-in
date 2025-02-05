import { RedirectTogglingService } from '../domain/redirect_toggling'

enum AlarmName {
  TOGGLE_REDIRECT_RULES = 'toggleRedirectRules'
}

const redirectTogglingService = RedirectTogglingService.create()

// Noted that e2e tests are hard to cover all of the below properly. Better use a bit manual testing if needed.

chrome.alarms.onAlarm.addListener((alarm) => {
  console.debug('Alarm fired:', alarm)
  if (alarm.name === AlarmName.TOGGLE_REDIRECT_RULES) {
    return redirectTogglingService.run()
  }
})
chrome.alarms.create(AlarmName.TOGGLE_REDIRECT_RULES, { periodInMinutes: 0.5, when: Date.now() })
