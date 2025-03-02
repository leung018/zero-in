import { BackgroundListener } from './listener'
import { BrowsingControlTogglingService } from '../domain/browsing_control_toggling'

const redirectTogglingService = BrowsingControlTogglingService.create()

// Noted that e2e tests are hard to cover below related to alarms properly. Better use a bit manual testing if needed.
chrome.alarms.onAlarm.addListener((alarm) => {
  console.debug('Alarm fired:', alarm)
  redirectTogglingService.run()
})
chrome.alarms.create({ periodInMinutes: 0.5, when: Date.now() })

BackgroundListener.create().start()
