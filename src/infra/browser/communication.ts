import { type CommunicationManager, type Port } from '../communication'

export class ChromeCommunicationManager implements CommunicationManager {
  clientConnect() {
    const chromePort = browser.runtime.connect()
    return new ChromePortWrapper(chromePort)
  }

  onNewClientConnect(callback: (backgroundPort: Port) => void) {
    browser.runtime.onConnect.addListener((chromePort) => {
      const port = new ChromePortWrapper(chromePort)
      return callback(port)
    })
  }
}

class ChromePortWrapper implements Port {
  private static MAX_RETRIES = 3

  private chromePort: Browser.runtime.Port

  constructor(chromePort: Browser.runtime.Port) {
    this.chromePort = chromePort
  }

  send(message: any, retryCount = 0): void {
    if (retryCount > ChromePortWrapper.MAX_RETRIES) {
      // Hard to cover this case. Can adjust the MAX_RETRIES to 0 and see if the error is logged after disconnect.
      // See below comment of how to trigger disconnect in console.
      console.error('Max retries reached. Unable to send message.')
      return
    }

    try {
      this.chromePort.postMessage(message)
    } catch (error) {
      console.info('Error when sending message. Will retry. Error:', error)
      this.chromePort = browser.runtime.connect()
      return this.send(message, retryCount + 1)
    }
  }

  onMessage(callback: (message: any) => void): void {
    this.chromePort.onMessage.addListener(callback)
  }

  onDisconnect(callback: () => void): void {
    // For how to verify below line, see comments in backgroundPort.onDisconnect in service_workers/listener.ts
    this.chromePort.onDisconnect.addListener(callback)
  }

  disconnect(): void {
    // Have expose this wrapper to window in a page for e2e test of retry handling. Search for window._port in e2e test for more detail.
    // So can call _port.disconnect() on that page to trigger this function.
    // See comments in backgroundPort.onDisconnect in service_workers/listener.ts for how to verify the disconnect behavior.
    this.chromePort.disconnect()
  }
}
