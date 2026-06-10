import { ExpoPushClientImpl } from '@zero-in/shared/infra/push/expo-push-client'
import { MobileSyncNotifier } from '@zero-in/shared/infra/push/mobile-sync-notifier'
import { RemoteStorage, Unsubscribe } from '@zero-in/shared/infra/storage/interface'
import { FirebaseServices } from '../firebase/services'
import { AdaptiveStorageProvider } from './adaptive'

export class PushNotifyingStorageProvider implements RemoteStorage {
  static create(): PushNotifyingStorageProvider {
    return new PushNotifyingStorageProvider(
      AdaptiveStorageProvider.create(),
      new MobileSyncNotifier({
        getTokenStorage: async () => {
          if (!(await FirebaseServices.isAuthenticated())) return null
          return FirebaseServices.getFirestoreTokenStorage()
        },
        pushClient: new ExpoPushClientImpl()
      })
    )
  }

  constructor(
    private readonly inner: RemoteStorage,
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
