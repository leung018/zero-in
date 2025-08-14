import { StorageInterface } from './interface'
import { FakeLocalStorage, LocalStorage } from './local_storage'

export class LocalStorageWrapper implements StorageInterface {
  static create() {
    return new LocalStorageWrapper(browser.storage.local)
  }

  static createFake() {
    return new LocalStorageWrapper(new FakeLocalStorage())
  }

  private constructor(private localStorage: LocalStorage) {}

  private onChangeListeners: Map<string, ((data: any) => void)[]> = new Map()

  async get(key: string): Promise<any> {
    const result = await this.localStorage.get(key)
    return result[key]
  }

  async set(key: string, data: any): Promise<void> {
    await this.localStorage.set({ [key]: data })
    this.onChangeListeners.get(key)?.forEach((callback) => callback(data))
  }

  onChange(key: string, callback: (data: any) => void) {
    // TODO: This function is for testing purpose and should not trigger in the production app
    // May need think of better way that not using if condition here to achieve it

    if (!(this.localStorage instanceof FakeLocalStorage)) {
      return
    }

    if (!this.onChangeListeners.has(key)) {
      this.onChangeListeners.set(key, [])
    }
    this.onChangeListeners.get(key)?.push(callback)
  }
}
