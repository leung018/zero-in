import { type CommunicationManager, type Port } from '../infra/communication'

export class ChromeCommunicationManager implements CommunicationManager {
  clientConnect() {
    const chromePort = chrome.runtime.connect()
    return mapChromePortToPort(chromePort)
  }

  onNewClientConnect(callback: (backgroundPort: Port) => void) {
    chrome.runtime.onConnect.addListener((chromePort) => {
      const port = mapChromePortToPort(chromePort)
      return callback(port)
    })
  }
}

function mapChromePortToPort(chromePort: chrome.runtime.Port) {
  return {
    send: (message: any) => {
      return chromePort.postMessage(message)
    },
    onMessage: (callback: (message: any) => void) => {
      return chromePort.onMessage.addListener(callback)
    },
    onDisconnect: (callback: () => void) => {
      // To verify the below line, can observe the debug logging when disconnect is fired in listener.
      // I don't plan to e2e test it because it is not behavior that the user may care about. It belongs to some optimization instead.
      return chromePort.onDisconnect.addListener(callback)
    }
  }
}
