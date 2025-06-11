import { ChromeNewTabService } from '../infra/browser/new_tab'
import { getStartOfNextMinute } from '../utils/date'
import { BackgroundListener } from './listener'
import { MenuItemId } from './menu_item_id'

chrome.runtime.onStartup.addListener(function () {}) // Register an empty onStartup listener to ensure the service worker activates immediately after browser restart

const listener = BackgroundListener.create()
listener.start().then(() => {
  console.log('BackgroundListener started successfully.')
})

// Noted that e2e tests are hard to cover all of the below related to chrome api properly. Better use a bit manual testing if needed.

// Periodically toggling browsing rules
// alarms related code should not put inside onInstalled.addListener because they should be triggered even when the browser is restarted
chrome.alarms.onAlarm.addListener(() => {
  // Uncomment below and add alarm as argument above to observe the alarm firing
  // console.debug('Alarm fired:', alarm)
  listener.toggleBrowsingRules()
})
const now = new Date()
chrome.alarms.create('immediate', { when: now.getTime() })
chrome.alarms.create('recurring', { periodInMinutes: 1, when: getStartOfNextMinute(now).getTime() })
chrome.alarms.clear() // Remove old alarm in previous version, if any

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated.')

  // Creating context menu items
  chrome.contextMenus.create({
    id: MenuItemId.OPEN_STATISTICS,
    title: 'Statistics',
    contexts: ['action']
  })
  chrome.contextMenus.create({
    id: MenuItemId.ADD_BLOCKED_DOMAIN,
    title: 'Add site to blocked domains',
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  })
  chrome.contextMenus.onClicked.addListener((info) => {
    switch (info.menuItemId) {
      case MenuItemId.OPEN_STATISTICS:
        new ChromeNewTabService(chrome.runtime.getURL('options.html') + '#/statistics').trigger()
        break
      case MenuItemId.ADD_BLOCKED_DOMAIN:
        if (info.pageUrl) {
          listener.addBlockedDomain(info.pageUrl)
        }
        break
    }
  })
})
