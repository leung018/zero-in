import { FirebaseServices } from '../firebase/services'
import { ObservableStorage, Unsubscribe } from './interface'

export class FirestoreStorageWrapper implements ObservableStorage {
  static create(): FirestoreStorageWrapper {
    return new FirestoreStorageWrapper()
  }

  async get(key: string): Promise<any> {
    const storage = await FirebaseServices.getFirestoreStorage()
    return storage.get(key)
  }

  async set(key: string, data: any): Promise<void> {
    const storage = await FirebaseServices.getFirestoreStorage()
    return storage.set(key, data)
  }

  async onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    const storage = await FirebaseServices.getFirestoreStorage()
    return storage.onChange(key, callback)
  }
}
