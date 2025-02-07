type Listener = (message: any, sendResponse: (response?: any) => void) => void

interface Messenger {
  send(message: any): Promise<void>
  addListener(callback: Listener): void
}

export class ChromeMessenger {
  private messenger: Messenger

  static create(): ChromeMessenger {
    return new ChromeMessenger({
      send: (message: any) => {
        return chrome.runtime.sendMessage(message)
      },
      addListener: (callback: Listener) => {
        return chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
          callback(message, sendResponse)
          return true
        })
      }
    })
  }

  static createFake(): ChromeMessenger {
    return new ChromeMessenger(new FakeMessenger())
  }

  private constructor(messenger: Messenger) {
    this.messenger = messenger
  }

  async send(message: any): Promise<void> {
    return this.messenger.send(message)
  }

  addListener(callback: Listener): void {
    return this.messenger.addListener(callback)
  }
}

class FakeMessenger implements Messenger {
  private listeners: Listener[] = []

  async send(message: any): Promise<void> {
    this.listeners.forEach((listener) => listener(message, () => {}))
  }

  addListener(callback: Listener): void {
    this.listeners.push(callback)
  }
}
