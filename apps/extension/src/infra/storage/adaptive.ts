import {
  ObservableStorage,
  StorageInterface,
  Unsubscribe
} from '@zero-in/shared/infra/storage/interface'
import { FirebaseServices, FirestoreStorage } from '../firebase/services'
import { newLocalStorage } from './local-storage'

export class AdaptiveStorageProvider implements ObservableStorage {
  static create(storage = newLocalStorage()): AdaptiveStorageProvider {
    return new AdaptiveStorageProvider(storage)
  }

  constructor(private unauthenticatedStorage: StorageInterface) {}

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
    if (storage instanceof FirestoreStorage) {
      return storage.onChange(key, callback)
    }
    return Promise.resolve(() => {})
  }

  private async getStorage() {
    if (await FirebaseServices.isAuthenticated()) {
      return FirebaseServices.getFirestoreStorage()
    } else {
      return this.unauthenticatedStorage
    }
  }
}
