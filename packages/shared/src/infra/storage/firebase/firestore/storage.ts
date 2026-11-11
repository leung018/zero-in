import { RemoteStorage, Unsubscribe } from '../../interface'
import { FirestoreAdapter, FirestoreDocumentReference } from './adapter'

// Every collection listed here is deleted when the user deletes their account.
const USER_COLLECTIONS = ['application', 'pushTokens'] as const

type UserCollection = (typeof USER_COLLECTIONS)[number]

export class FirestoreStorage implements RemoteStorage {
  static createAppStorage({
    userId,
    adapter
  }: {
    userId: string
    adapter: FirestoreAdapter
  }): FirestoreStorage {
    return FirestoreStorage.createUserStorage({ userId, adapter, collection: 'application' })
  }

  static createTokenStorage({
    userId,
    adapter
  }: {
    userId: string
    adapter: FirestoreAdapter
  }): FirestoreStorage {
    return FirestoreStorage.createUserStorage({ userId, adapter, collection: 'pushTokens' })
  }

  static createAllUserStorages({
    userId,
    adapter
  }: {
    userId: string
    adapter: FirestoreAdapter
  }): FirestoreStorage[] {
    return USER_COLLECTIONS.map((collection) =>
      FirestoreStorage.createUserStorage({ userId, adapter, collection })
    )
  }

  static createDeletionMarkerStorage({ adapter }: { adapter: FirestoreAdapter }): FirestoreStorage {
    return new FirestoreStorage(adapter, ['deletedUsers'])
  }

  private static createUserStorage({
    userId,
    adapter,
    collection
  }: {
    userId: string
    adapter: FirestoreAdapter
    collection: UserCollection
  }): FirestoreStorage {
    return new FirestoreStorage(adapter, ['users', userId, collection])
  }

  private constructor(
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

  async getKeys(): Promise<string[]> {
    const [first, ...rest] = this.pathPrefix
    return (await this.adapter.getDocs(first, ...rest)).map((s) => s.id)
  }

  private docRef(key: string): FirestoreDocumentReference {
    const [first, ...rest] = this.pathPrefix
    return this.adapter.doc(first, ...rest, key)
  }
}
