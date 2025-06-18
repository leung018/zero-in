import { ChromeNewTabService } from '../infra/browser/new_tab'
import { getStartOfNextMinute } from '../utils/date'
import { BackgroundListener } from './listener'
import { MenuItemId } from './menu_item_id'

chrome.runtime.onStartup.addListener(function () {}) // Register an empty onStartup listener to ensure the service worker activates immediately after browser restart

const listener = BackgroundListener.create()
listener.start()

// Noted that e2e tests are hard to cover all of the below related to chrome api properly. Better use a bit manual testing if needed.

// Periodically toggling browsing rules
chrome.alarms.onAlarm.addListener(() => {
  // Uncomment below and add alarm as argument above to observe the alarm firing
  // console.debug('Alarm fired:', alarm)
  listener.toggleBrowsingRules()
})
const now = new Date()
chrome.alarms.create('immediate', { when: now.getTime() })
chrome.alarms.create('recurring', { periodInMinutes: 1, when: getStartOfNextMinute(now).getTime() })
chrome.alarms.clear() // Remove old alarm in previous version, if any

// Creating context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Context menu items are only created during extension installation or updates because:
  // 1. They persist through browser restarts (no need to recreate them)
  // 2. Creating items with duplicate IDs would populate chrome.runtime.lastError with an error message,
  //    which we avoid by only creating them during installation/updates

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

chrome.runtime.setUninstallURL(
  'https://docs.google.com/forms/d/e/1FAIpQLScfcCncqKHC9M9fUDnOFR4SWcpjwmWrO1y1qjp7-7cRTmFF8A/viewform?usp=header'
)
