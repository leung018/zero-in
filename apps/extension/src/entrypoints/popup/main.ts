import { wakeUpServiceWorkerIfIdle } from '../../infra/browser/wake_service_worker'
import { mountNewApp } from '../../mount'
import PopupApp from './App.vue'

// Add wakeUp function to address the bug where the timer popup freezes at 00:00 when the service worker becomes idle.
// The bug only occurs in actual extension popups and won't appear if popup.html is opened as a regular page.
//
// Testing notes:
// - Difficult to test with e2e because Playwright cannot open real extension popups.
//   (Playwright can only open popup.html as a regular page, not as an extension popup)
// - To manually test:
//   1. Navigate to chrome://serviceworker-internals/
//   2. Stop the service worker
//   3. Open the timer popup to verify the freeze bug is resolved
wakeUpServiceWorkerIfIdle().then(() => {
  mountNewApp(PopupApp)
})
