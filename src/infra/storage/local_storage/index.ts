import { StorageInterface } from '../interface'
import { FakeLocalStorage, LocalStorage } from './local_storage'

export class LocalStorageWrapper implements StorageInterface {
  static create() {
    return new LocalStorageWrapper(browser.storage.local)
  }

  static createFake() {
    return new LocalStorageWrapper(new FakeLocalStorage())
  }

  constructor(private localStorage: LocalStorage) {}

  async get(key: string): Promise<any> {
    const result = await this.localStorage.get(key)
    return result[key]
  }

  async set(key: string, data: any): Promise<void> {
    await this.localStorage.set({ [key]: data })
  }
}
