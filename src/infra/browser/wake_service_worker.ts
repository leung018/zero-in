export async function wakeUpServiceWorkerIfIdle() {
  // This function addresses a bug where the timer popup freezes at 00:00 when the service worker becomes idle.
  // The bug only occurs in actual extension popups and won't appear if popup.html is opened as a regular page.
  // It sends a PING message to wake up the service worker before mounting the app.
  //
  // Testing notes:
  // - Difficult to test with e2e because Playwright cannot open real extension popups.
  //   (Playwright can only open popup.html as a regular page, not as an extension popup)
  // - To manually test:
  //   1. Navigate to chrome://serviceworker-internals/
  //   2. Stop the service worker
  //   3. Open the timer popup to verify the freeze bug is resolved

  return browser.runtime.sendMessage({ type: 'PING' })
}
