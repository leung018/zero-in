import { SubscriptionManager } from '@zero-in/shared/utils/subscription'
import { ObservableStorage, Unsubscribe } from './interface'
import { LocalStorageWrapper } from './local-storage'

export class FakeObservableStorage implements ObservableStorage {
  static create() {
    return new FakeObservableStorage(LocalStorageWrapper.createFake())
  }

  private activeKeys: Set<string> = new Set()

  private constructor(private localStorage: LocalStorageWrapper) {}

  private subscriptionManager = new SubscriptionManager<{
    key: string
    data: any
  }>()

  async get(key: string): Promise<any> {
    if (!this.activeKeys.has(key)) {
      return undefined
    }
    return this.localStorage.get(key)
  }

  async set(key: string, data: any): Promise<void> {
    this.activeKeys.add(key)
    await this.localStorage.set(key, data)
    this.subscriptionManager.broadcast({ key, data })
  }

  async delete(key: string): Promise<void> {
    this.activeKeys.delete(key)
  }

  async getKeys(): Promise<string[]> {
    return Array.from(this.activeKeys)
  }

  async onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    const subscriptionId = this.subscriptionManager.subscribe((operation) => {
      if (operation.key === key) {
        callback(operation.data)
      }
    })

    return () => {
      this.subscriptionManager.unsubscribe(subscriptionId)
    }
  }
}
