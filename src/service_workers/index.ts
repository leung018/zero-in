import { BackgroundListener } from './listener'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'

// Noted that e2e tests are hard to cover all of the below related to chrome api properly. Better use a bit manual testing if needed.

const redirectTogglingService = BrowsingControlTogglingService.create()

chrome.alarms.onAlarm.addListener((alarm) => {
  console.debug('Alarm fired:', alarm)
  redirectTogglingService.run()
})
chrome.alarms.create({ periodInMinutes: 0.5, when: Date.now() })

BackgroundListener.create().start()

chrome.runtime.onStartup.addListener(function () {}) // This is a hack to keep the above run immediately after the browser is closed and reopened
