import { ObservableStorage, Unsubscribe } from './interface'
import { LocalStorageWrapper } from './local_storage'

export class FakeObservableStorage implements ObservableStorage {
  static create() {
    return new FakeObservableStorage(LocalStorageWrapper.createFake())
  }

  private constructor(private localStorage: LocalStorageWrapper) {}

  private onChangeListeners: Map<string, ((data: any) => void)[]> = new Map()

  async get(key: string): Promise<any> {
    return this.localStorage.get(key)
  }

  async set(key: string, data: any): Promise<void> {
    await this.localStorage.set(key, data)
    this.onChangeListeners.get(key)?.forEach((callback) => callback(data))
  }

  async onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    if (!this.onChangeListeners.has(key)) {
      this.onChangeListeners.set(key, [])
    }
    this.onChangeListeners.get(key)?.push(callback)

    const callbackIndex = (this.onChangeListeners.get(key)?.length || 1) - 1

    return () => {
      this.onChangeListeners.get(key)?.splice(callbackIndex, 1)
    }
  }
}
