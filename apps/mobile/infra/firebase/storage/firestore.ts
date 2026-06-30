import { ObservableStorage, Unsubscribe } from '@zero-in/shared/infra/storage/interface'
import { FirebaseServices } from '../services'

export class FirestoreAppStorageWrapper implements ObservableStorage {
  // Purpose of this wrapper is to remove then need of async factory method for FirestoreAppStorage.
  // In the future, can consider removing this wrapper and directly use FirestoreAppStorage with async factory method.

  static create(): FirestoreAppStorageWrapper {
    return new FirestoreAppStorageWrapper()
  }

  async get(key: string): Promise<any> {
    const storage = await FirebaseServices.getFirestoreAppStorage()
    return storage.get(key)
  }

  async set(key: string, data: any): Promise<void> {
    const storage = await FirebaseServices.getFirestoreAppStorage()
    return storage.set(key, data)
  }

  async onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    const storage = await FirebaseServices.getFirestoreAppStorage()
    return storage.onChange(key, callback)
  }
}
