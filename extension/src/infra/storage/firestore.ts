import { ObservableStorage, Unsubscribe } from '../../../../shared/src/infra/storage/interface'
import { FirebaseServices } from '../firebase/services'

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
