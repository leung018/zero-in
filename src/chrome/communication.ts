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
      return chromePort.onDisconnect.addListener(callback)
    }
  }
}
