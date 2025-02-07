export interface StorageHandler {
  set(obj: any): Promise<void>
  get(key: string): Promise<any>
}

export class ChromeLocalStorageFactory {
  static createStorageHandler(): StorageHandler {
    return chrome.storage.local
  }

  static createFakeStorageHandler(): StorageHandler {
    return new FakeChromeLocalStorage()
  }
}

class FakeChromeLocalStorage implements StorageHandler {
  private storage: any = {}

  async set(update: any): Promise<void> {
    this.storage = { ...this.storage, ...update }
  }

  async get(key: string): Promise<any> {
    return { [key]: this.storage[key] }
  }
}
