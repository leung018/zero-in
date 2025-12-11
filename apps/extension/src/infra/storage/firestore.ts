import { ObservableStorage, Unsubscribe } from '@zero-in/shared/infra/storage/interface'
import { FirebaseServices } from '../firebase/services'

export class FirestoreAppStorageWrapper implements ObservableStorage {
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
