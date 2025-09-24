import { sharedExampleValue } from '@shared/index'
import { BrowserNewTabService } from '../infra/browser/new_tab'
import { firebaseAuth } from '../infra/browser/sign_in'
import { FirebaseServices } from '../infra/firebase/services'
import { retryUntilSuccess } from '../utils/retry'
import { BackgroundListener } from './listener'
import { MenuItemId } from './menu_item_id'

export default function main() {
  console.log('sharedExampleValue:', sharedExampleValue)

  browser.runtime.onStartup.addListener(function () {}) // Register an empty onStartup listener to ensure the service worker activates immediately after browser restart

  const listener = BackgroundListener.create()

  // Noted that e2e tests are hard to cover all of the below properly. Better use a bit manual testing if needed.

  retryUntilSuccess(
    () => {
      return listener.start()
    },
    {
      functionName: 'BackgroundListener.start'
    }
  ).then(() => {
    browser.runtime.onMessage.addListener((message, _, sendResponse) => {
      if (message.type === 'PING') {
        sendResponse({ type: 'PONG' })
      }
      if (message.type === 'SIGN_IN') {
        firebaseAuth()
          .then((auth) => {
            return FirebaseServices.signInWithToken(auth._tokenResponse.oauthIdToken).then(() => {
              sendResponse({
                type: 'SIGN_IN_SUCCESS',
                payload: auth
              })
            })
          })
          .catch((error) => {
            console.error('Sign in failed', error)
            sendResponse({
              type: 'SIGN_IN_FAILURE'
            })
          })
      }
      if (message.type == 'RELOAD') {
        listener
          .reload()
          .then(() => {
            sendResponse({ type: 'RELOAD_SUCCESS' })
          })
          .catch((err) => {
            if (err.code === 'permission-denied') {
              console.log(
                'Permission denied during reload - ignoring as onAuthStateChanged will handle the reload'
              )
              sendResponse({ type: 'RELOAD_FAILURE' })
            } else {
              throw err
            }
          })
      }
      return true
    })

    // Execute reload only when listener.start is resolved.
    FirebaseServices.onAuthStateChanged(() => {
      retryUntilSuccess(
        () => {
          return listener.reload()
        },
        {
          functionName: 'BackgroundListener.reload'
        }
      )
    })
  })

  // Periodically toggling browsing rules
  browser.alarms.onAlarm.addListener(() => {
    // Uncomment below and add alarm as argument above to observe the alarm firing
    // console.debug('Alarm fired:', alarm)
    listener.toggleBrowsingRules()
  })
  const now = new Date()
  browser.alarms.create('immediate', { when: now.getTime() })
  browser.alarms.create('recurring', {
    periodInMinutes: 1,
    when: getStartOfNextMinute(now).getTime()
  })
  browser.alarms.clear() // Remove old alarm in previous version, if any

  // Creating context menu items
  browser.runtime.onInstalled.addListener(() => {
    // Context menu items are only created during extension installation or updates because:
    // 1. They persist through browser restarts (no need to recreate them)
    // 2. Creating items with duplicate IDs would populate browser.runtime.lastError with an error message,
    //    which we avoid by only creating them during installation/updates

    browser.contextMenus.create({
      id: MenuItemId.OPEN_STATISTICS,
      title: 'Statistics',
      contexts: ['action']
    })
    browser.contextMenus.create({
      id: MenuItemId.ADD_BLOCKED_DOMAIN,
      title: 'Add site to blocked domains',
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    })
  })
  browser.contextMenus.onClicked.addListener((info) => {
    switch (info.menuItemId) {
      case MenuItemId.OPEN_STATISTICS:
        new BrowserNewTabService(browser.runtime.getURL('/options.html') + '#/statistics').trigger()
        break
      case MenuItemId.ADD_BLOCKED_DOMAIN:
        if (info.pageUrl) {
          listener.addBlockedDomain(info.pageUrl)
        }
        break
    }
  })

  browser.runtime.setUninstallURL(
    'https://docs.google.com/forms/d/e/1FAIpQLScfcCncqKHC9M9fUDnOFR4SWcpjwmWrO1y1qjp7-7cRTmFF8A/viewform?usp=header'
  )
}
