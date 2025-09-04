import { sleep } from '../../utils/operation'

const MAX_RETRIES = 3

/**
 * It sends a PING message to wake up the service worker if it is idle.
 */
export async function wakeUpServiceWorkerIfIdle(retryCount = 0) {
  if (retryCount > MAX_RETRIES) {
    console.error('Max retries reached. Unable to wake up service worker.')
    return
  }

  try {
    await browser.runtime.sendMessage({ type: 'PING' })
  } catch (error) {
    console.info('Failed to wake up service worker — will retry. Error:', error)
    await sleep(500)
    return wakeUpServiceWorkerIfIdle(retryCount + 1)
  }
}
