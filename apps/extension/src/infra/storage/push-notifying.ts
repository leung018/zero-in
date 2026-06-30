import { MobileSyncNotifier } from '@zero-in/shared/infra/push/mobile-sync-notifier'
import { FakeRemoteStorage } from '@zero-in/shared/infra/storage/fake'
import { ObservableStorage, Unsubscribe } from '@zero-in/shared/infra/storage/interface'
import { FirebaseServices } from '../firebase/services'
import { AdaptiveAppStorageProvider } from './adaptive'

// TODO: Think of better name
//
// For why introducing this, because PushNotifyingStorageProvider only need to call notify.
// And If we make it depend on MobileSyncNotifier, it also need to consider the cases if register/unregister fails due to token storage is unavailable (e.g. user signed out).
// So depends on interface below make that have less responsibility.
interface AbstractMobileSyncNotifier {
  notify: () => Promise<void>
}

export class PushNotifyingStorageProvider implements ObservableStorage {
  static create(): PushNotifyingStorageProvider {
    return new PushNotifyingStorageProvider(
      AdaptiveAppStorageProvider.create(),
      MobileSyncNotifier.create(FirebaseServices.getFirestoreTokenStorage)
    )
  }

  static createFake(notifier: AbstractMobileSyncNotifier): PushNotifyingStorageProvider {
    return new PushNotifyingStorageProvider(FakeRemoteStorage.create(), notifier)
  }

  constructor(
    private readonly inner: ObservableStorage,
    private readonly notifier: AbstractMobileSyncNotifier
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
