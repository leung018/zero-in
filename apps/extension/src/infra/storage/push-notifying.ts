import { ObservableStorage, Unsubscribe } from '@zero-in/shared/infra/storage/interface'
import { MobileSyncNotifier } from '../push/mobile-sync-notifier'
import { AdaptiveStorageProvider } from './adaptive'

export class PushNotifyingStorageProvider implements ObservableStorage {
  static create(): PushNotifyingStorageProvider {
    return new PushNotifyingStorageProvider(
      AdaptiveStorageProvider.create(),
      MobileSyncNotifier.create()
    )
  }

  constructor(
    private readonly inner: ObservableStorage,
    private readonly notifier: MobileSyncNotifier
  ) {}

  async set(key: string, data: any): Promise<void> {
    await this.inner.set(key, data)
    this.notifier.notify().catch(() => {})
  }

  get(key: string): Promise<any> {
    return this.inner.get(key)
  }

  onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    return this.inner.onChange(key, callback)
  }
}
