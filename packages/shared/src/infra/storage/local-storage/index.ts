import { StorageInterface } from '../interface'
import { FakeLocalStorage, LocalStorage } from './local-storage'

export class LocalStorageWrapper implements StorageInterface {
  static createFake() {
    return new LocalStorageWrapper(new FakeLocalStorage())
  }

  private knownKeys = new Set<string>()

  constructor(private localStorage: LocalStorage) {}

  async get(key: string): Promise<any> {
    const result = await this.localStorage.get(key)
    return result[key]
  }

  async set(key: string, data: any): Promise<void> {
    this.knownKeys.add(key)
    await this.localStorage.set({ [key]: data })
  }

  // Not used yet
  async delete(key: string): Promise<void> {
    this.knownKeys.delete(key)
    await this.localStorage.remove(key)
  }

  // Not used yet — only reflects keys set through this wrapper instance
  async getKeys(): Promise<string[]> {
    return [...this.knownKeys]
  }
}
