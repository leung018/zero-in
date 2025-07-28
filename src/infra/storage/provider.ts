import { FirebaseServices } from '../firebase_services'
import { StorageInterface } from './interface'
import { LocalStorageWrapper } from './local_storage_wrapper'

export class AdaptiveStorageProvider implements StorageInterface {
  static create(storage = LocalStorageWrapper.create()): AdaptiveStorageProvider {
    return new AdaptiveStorageProvider(storage)
  }

  constructor(private unauthenticatedStorage: StorageInterface) {}

  async get(key: string): Promise<any> {
    if (await FirebaseServices.isAuthenticated()) {
      return (await FirebaseServices.getFirestoreStorage()).get(key)
    } else {
      return this.unauthenticatedStorage.get(key)
    }
  }

  async set(key: string, data: any): Promise<void> {
    if (await FirebaseServices.isAuthenticated()) {
      await (await FirebaseServices.getFirestoreStorage()).set(key, data)
    } else {
      await this.unauthenticatedStorage.set(key, data)
    }
  }
}
