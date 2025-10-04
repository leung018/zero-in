import { SubscriptionManager } from '@/utils/subscription'
import { ObservableStorage, Unsubscribe } from './interface'
import { LocalStorageWrapper } from './local-storage'

export class FakeObservableStorage implements ObservableStorage {
  static create() {
    return new FakeObservableStorage(LocalStorageWrapper.createFake())
  }

  private constructor(private localStorage: LocalStorageWrapper) {}

  private subscriptionManager = new SubscriptionManager<{
    key: string
    data: any
  }>()

  async get(key: string): Promise<any> {
    return this.localStorage.get(key)
  }

  async set(key: string, data: any): Promise<void> {
    await this.localStorage.set(key, data)
    this.subscriptionManager.broadcast({ key, data })
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
