interface Messenger {
  send(message: any): Promise<void>
  addListener(callback: (message: any) => boolean | undefined): void
}

export class ChromeMessenger {
  private messenger: Messenger

  static create(): ChromeMessenger {
    return new ChromeMessenger({
      send: (message: any) => {
        return chrome.runtime.sendMessage(message)
      },
      addListener: (callback: (message: any) => boolean | undefined) => {
        return chrome.runtime.onMessage.addListener(callback)
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

  addListener(callback: (message: any) => boolean | undefined): void {
    return this.messenger.addListener(callback)
  }
}

class FakeMessenger implements Messenger {
  private listeners: ((message: any) => boolean | undefined)[] = []

  async send(message: any): Promise<void> {
    this.listeners.forEach((listener) => listener(message))
  }

  addListener(callback: (message: any) => boolean | undefined): void {
    this.listeners.push(callback)
  }
}
