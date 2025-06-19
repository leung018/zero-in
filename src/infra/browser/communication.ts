import { type CommunicationManager, type Port } from '../communication'

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

  send(message: any, retryCount = 0): void {
    if (retryCount > BrowserPortWrapper.MAX_RETRIES) {
      // Hard to cover this case. Can adjust the MAX_RETRIES to 0 and see if the error is logged after disconnect.
      // See below comment of how to trigger disconnect in console.
      console.error('Max retries reached. Unable to send message.')
      return
    }

    try {
      this.browserPort.postMessage(message)
    } catch (error) {
      console.info('Error when sending message. Will retry. Error:', error)
      this.browserPort = browser.runtime.connect()
      return this.send(message, retryCount + 1)
    }
  }

  onMessage(callback: (message: any) => void): void {
    this.browserPort.onMessage.addListener(callback)
  }

  onDisconnect(callback: () => void): void {
    // For how to verify below line, see comments in backgroundPort.onDisconnect in service_workers/listener.ts
    this.browserPort.onDisconnect.addListener(callback)
  }

  disconnect(): void {
    // Have expose this wrapper to window in a page for e2e test of retry handling. Search for window._port in e2e test for more detail.
    // So can call _port.disconnect() on that page to trigger this function.
    // See comments in backgroundPort.onDisconnect in service_workers/listener.ts for how to verify the disconnect behavior.
    this.browserPort.disconnect()
  }
}
