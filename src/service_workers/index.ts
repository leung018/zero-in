import { ChromeNewTabService } from '../infra/browser/new_tab'
import { getStartOfNextMinute } from '../utils/date'
import { BackgroundListener } from './listener'
import { MenuItemId } from './menu_item_id'

// Noted that e2e tests are hard to cover all of the below related to chrome api properly. Better use a bit manual testing if needed.

const listener = BackgroundListener.create()
listener.start()

chrome.alarms.onAlarm.addListener(() => {
  // Uncomment below and add alarm as argument above to observe the alarm firing
  // console.debug('Alarm fired:', alarm)
  listener.toggleBrowsingRules()
})
const now = new Date()
chrome.alarms.create('immediate', { when: now.getTime() })
chrome.alarms.create('recurring', { periodInMinutes: 1, when: getStartOfNextMinute(now).getTime() })

chrome.runtime.onStartup.addListener(function () {}) // This is a hack to keep the above run immediately after the browser is closed and reopened

chrome.runtime.onInstalled.addListener(() => {
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
