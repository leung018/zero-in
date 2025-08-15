import { FirebaseServices } from '../firebase/services'
import { ObservableStorage, Unsubscribe } from './interface'
import { LocalStorageWrapper } from './local_storage_wrapper'

export class AdaptiveStorageProvider implements ObservableStorage {
  static create(storage = LocalStorageWrapper.create()): AdaptiveStorageProvider {
    return new AdaptiveStorageProvider(storage)
  }

  constructor(private unauthenticatedStorage: ObservableStorage) {}

  async get(key: string): Promise<any> {
    const storage = await this.getStorage()
    return storage.get(key)
  }

  async set(key: string, data: any): Promise<void> {
    const storage = await this.getStorage()
    return storage.set(key, data)
  }

  async onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    const storage = await this.getStorage()
    return storage.onChange(key, callback)
  }

  private async getStorage() {
    if (await FirebaseServices.isAuthenticated()) {
      return FirebaseServices.getFirestoreStorage()
    } else {
      return this.unauthenticatedStorage
    }
  }
}
