import { ObservableStorage, Unsubscribe } from '../../interface'
import { FirestoreAdapter, FirestoreDocumentReference, FirestoreDocumentSnapshot } from './adapter'

export class FirestoreStorage implements ObservableStorage {
  static createAppStorage({
    userId,
    adapter
  }: {
    userId: string
    adapter: FirestoreAdapter
  }): FirestoreStorage {
    return new FirestoreStorage(adapter, ['users', userId, 'application'])
  }

  static createTokenStorage({
    userId,
    adapter
  }: {
    userId: string
    adapter: FirestoreAdapter
  }): FirestoreStorage {
    return new FirestoreStorage(adapter, ['users', userId, 'pushTokens'])
  }

  constructor(
    private readonly adapter: FirestoreAdapter,
    private readonly pathPrefix: string[]
  ) {}

  async set(key: string, value: any): Promise<void> {
    await this.adapter.setDoc(this.docRef(key), value)
  }

  async get(key: string): Promise<any> {
    const snapshot = await this.adapter.getDoc(this.docRef(key))
    return snapshot.data()
  }

  async delete(key: string): Promise<void> {
    await this.adapter.deleteDoc(this.docRef(key))
  }

  async onChange(key: string, callback: (data: any) => void): Promise<Unsubscribe> {
    return this.adapter.onSnapshot(this.docRef(key), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data())
      }
    })
  }

  async list(): Promise<FirestoreDocumentSnapshot[]> {
    const [first, ...rest] = this.pathPrefix
    return this.adapter.getDocs(first, ...rest)
  }

  private docRef(key: string): FirestoreDocumentReference {
    const [first, ...rest] = this.pathPrefix
    return this.adapter.doc(first, ...rest, key)
  }
}
