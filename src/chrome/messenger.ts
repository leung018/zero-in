import type { Listener, Messenger } from '../domain/messenger'

export class MessengerFactory {
  static createMessenger(): Messenger {
    return {
      send: (message: any) => {
        return chrome.runtime.sendMessage(message)
      },
      addListener: (callback: Listener) => {
        return chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
          callback(message, sendResponse)
          return true
        })
      }
    }
  }

  static createFakeMessenger(): Messenger {
    return new FakeMessenger()
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
