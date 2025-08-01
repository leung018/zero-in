import { FirebaseServices } from '../firebase/services'
import { StorageInterface } from './interface'
import { LocalStorageWrapper } from './local_storage_wrapper'

export class AdaptiveStorageProvider implements StorageInterface {
  static create(storage = LocalStorageWrapper.create()): AdaptiveStorageProvider {
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

  private async getStorage() {
    if (await FirebaseServices.isAuthenticated()) {
      return FirebaseServices.getFirestoreStorage()
    } else {
      return this.unauthenticatedStorage
    }
  }
}
