import { mountNewApp } from '../../mount'
import PopupApp from './App.vue'

wakeUpServiceWorkerIfIdle().then(() => {
  mountNewApp(PopupApp)
})

async function wakeUpServiceWorkerIfIdle() {
  // This function is try to fix the bug that the timer popup is freezed at 00:00 when the service worker is idle.

  // Hard to e2e test this function because playwright cannot open popup and the bug trying to fix is in popup only.
  // Playwright only can open popup.html as a page, but not as a popup.
  //
  // To manually test this, you can go to chrome://serviceworker-internals/ to stop the service worker.
  // Then open the timer popup and see if the above bug is fixed.

  return browser.runtime.sendMessage({ type: 'PING' }).catch(() => {
    console.info('Background service worker is idle. It will be woken up by above ping message.')
  })
}
