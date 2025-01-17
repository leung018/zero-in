declare const chrome: any // FIXME: Find a way to type this properly and also fix the type hint related to it.

interface ChromeStorage {
  set(obj: any): Promise<void>
  get(key: string): Promise<any>
}

export class ChromeLocalStorageWrapper {
  private storage: any

  public static create(): ChromeLocalStorageWrapper {
    return new ChromeLocalStorageWrapper(chrome.storage.local)
  }

  public static createFake(): ChromeLocalStorageWrapper {
    return new ChromeLocalStorageWrapper(new FakeChromeLocalStorage())
  }

  private constructor(storage: ChromeStorage) {
    this.storage = storage
  }

  async set(update: any): Promise<void> {
    return this.storage.set(update)
  }

  async get(key: string): Promise<any> {
    return this.storage.get(key)
  }
}

class FakeChromeLocalStorage implements ChromeStorage {
  private storage: any = {}

  async set(update: any): Promise<void> {
    this.storage = { ...this.storage, ...update }
  }

  async get(key: string): Promise<any> {
    return { [key]: this.storage[key] }
  }
}
