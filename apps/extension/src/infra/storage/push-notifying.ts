import { ObservableStorage, Unsubscribe } from '@zero-in/shared/infra/storage/interface'
import { notifyMobileSync } from '../push/expo-push'
import { AdaptiveStorageProvider } from './adaptive'

export class PushNotifyingStorageProvider implements ObservableStorage {
  static create(): PushNotifyingStorageProvider {
    return new PushNotifyingStorageProvider(AdaptiveStorageProvider.create())
  }

  constructor(private readonly inner: ObservableStorage) {}

  async set(key: string, data: any): Promise<void> {
    await this.inner.set(key, data)
    notifyMobileSync().catch(() => {})
  }

  get(key: string): Promise<any> {
    return this.inner.get(key)
  }

  onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    return this.inner.onChange(key, callback)
  }
}
