import { type CommunicationManager, type Port } from '../communication'
import { wakeUpServiceWorkerIfIdle } from './wake_service_worker'

export class BrowserCommunicationManager implements CommunicationManager {
  clientConnect() {
    const browserPort = browser.runtime.connect()
    return new BrowserPortWrapper(browserPort)
  }

  onNewClientConnect(callback: (backgroundPort: Port) => void) {
    browser.runtime.onConnect.addListener((browserPort) => {
      const port = new BrowserPortWrapper(browserPort)
      return callback(port)
    })
  }
}

class BrowserPortWrapper implements Port {
  private static MAX_RETRIES = 3

  private browserPort: Browser.runtime.Port

  constructor(browserPort: Browser.runtime.Port) {
    this.browserPort = browserPort
  }

  async send(message: any, retryCount = 0): Promise<void> {
    if (retryCount > BrowserPortWrapper.MAX_RETRIES) {
      // Hard to cover this case in e2e test. Can adjust the MAX_RETRIES to 0 and see if the error is logged after retry.
      // Can go to chrome://serviceworker-internals/ and stop the service worker to simulate the error below.
      console.error('Max retries reached. Unable to send message.')
      return
    }

    try {
      this.browserPort.postMessage(message)
    } catch (error) {
      console.info('Error when sending message. Will retry. Error:', error)
      return this.reconnect().then(() => {
        console.info('Reconnected to service worker. Retrying to send message:', message)
        return this.send(message, retryCount + 1)
      })
    }
  }

  private reconnect() {
    return wakeUpServiceWorkerIfIdle().then(() => {
      this.browserPort = browser.runtime.connect()
    })
  }

  onMessage(callback: (message: any) => void): void {
    this.browserPort.onMessage.addListener(callback)
  }

  onDisconnect(callback: () => void): void {
    // For how to verify below line, see comments in backgroundPort.onDisconnect in service_workers/listener.ts
    this.browserPort.onDisconnect.addListener(callback)
  }

  disconnect(): void {
    // See comments in backgroundPort.onDisconnect in service_workers/listener.ts for how to verify the disconnect behavior.
    this.browserPort.disconnect()
  }
}
