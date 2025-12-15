import { ObservableStorage, Unsubscribe } from '../../interface'
import { FirestoreAdapter, FirestoreDocumentReference } from './adapter'

/**
 * Firestore-based storage for application data.
 *
 * Platform-specific adapters should be provided via the constructor.
 */
export class FirestoreAppStorage implements ObservableStorage {
  constructor(
    private readonly userId: string,
    private readonly adapter: FirestoreAdapter
  ) {}

  async set(key: string, value: any): Promise<void> {
    const docRef = this.getDocRef(key)
    await this.adapter.setDoc(docRef, value)
  }

  async get(key: string): Promise<any> {
    const docRef = this.getDocRef(key)
    const snapshot = await this.adapter.getDoc(docRef)
    return snapshot.data()
  }

  async delete(key: string): Promise<void> {
    const docRef = this.getDocRef(key)
    await this.adapter.deleteDoc(docRef)
  }

  async onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    const docRef = this.getDocRef(key)
    return this.adapter.onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data())
      }
    })
  }

  private getDocRef(key: string): FirestoreDocumentReference {
    return this.adapter.doc('users', this.userId, 'application', key)
  }
}
