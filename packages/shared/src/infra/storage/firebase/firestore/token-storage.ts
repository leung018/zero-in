import { FirestoreAdapter, FirestoreDocumentReference } from './adapter'

const COLLECTION = 'pushTokens'

export interface PushTokenStorage {
  register(args: { token: string; platform: string }): Promise<void>
  unregister(token: string): Promise<void>
  listTokens(): Promise<string[]>
}

/**
 * Firestore-backed repository for Expo push tokens at
 * `users/{userId}/pushTokens/{token}`. Doc id = token.
 */
export class FirestoreTokenStorage implements PushTokenStorage {
  static create({
    userId,
    adapter
  }: {
    userId: string
    adapter: FirestoreAdapter
  }): FirestoreTokenStorage {
    return new FirestoreTokenStorage(userId, adapter)
  }

  private constructor(
    private readonly userId: string,
    private readonly adapter: FirestoreAdapter
  ) {}

  async register({ token, platform }: { token: string; platform: string }): Promise<void> {
    await this.adapter.setDoc(this.tokenRef(token), { token, platform })
  }

  async unregister(token: string): Promise<void> {
    await this.adapter.deleteDoc(this.tokenRef(token))
  }

  async listTokens(): Promise<string[]> {
    const snapshots = await this.adapter.getDocs('users', this.userId, COLLECTION)
    return snapshots.map((s) => s.id)
  }

  private tokenRef(token: string): FirestoreDocumentReference {
    return this.adapter.doc('users', this.userId, COLLECTION, token)
  }
}
