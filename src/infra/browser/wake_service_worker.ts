export async function wakeUpServiceWorkerIfIdle() {
  // It sends a PING message to wake up the service worker if it is idle.
  return browser.runtime.sendMessage({ type: 'PING' })
}
