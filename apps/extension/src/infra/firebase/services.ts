import config from '@/config'
import { FirestoreAppStorage } from '@zero-in/shared/infra/storage/firebase/firestore/app-storage'
import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  NextOrObserver,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  signOut,
  User
} from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { LocalStorageUserIdCache } from './local-storage-cache'
import { WebFirestoreAdapter } from './web-firestore-adapter'

const app = initializeApp(config.getFirebaseConfig())

const auth = getAuth(app)

const db = getFirestore(app)

if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)

  // @ts-expect-error Expose method for quickly signIn to window
  globalThis.signInWithTestCredential = () => {
    return FirebaseServices.signInWithToken(
      '{"sub": "abc123", "email": "foo@example.com", "email_verified": true}'
    )
  }
}

export class FirebaseServices {
  static async signOut() {
    await signOut(auth)
    await LocalStorageUserIdCache.setSignOut()
  }

  static async isAuthenticated(): Promise<boolean> {
    const userId = await this.getCurrentUserId()
    return userId !== null
  }

  static async signInWithToken(token: string) {
    const credential = await signInWithCredential(auth, GoogleAuthProvider.credential(token))
    await LocalStorageUserIdCache.setSignInUser(credential.user.uid)
  }

  static async setPersistence() {
    await setPersistence(auth, browserLocalPersistence)
  }

  static async getFirestoreAppStorage(): Promise<FirestoreAppStorage> {
    const userId = await this.getCurrentUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }
    return new FirestoreAppStorage(userId, new WebFirestoreAdapter(db))
  }

  static onAuthStateChanged(callback: NextOrObserver<User>) {
    return onAuthStateChanged(auth, callback)
  }

  private static async getCurrentUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      return LocalStorageUserIdCache.get().then(({ userId, isCacheSet }) => {
        if (!isCacheSet) {
          const unsubscribe = FirebaseServices.onAuthStateChanged((user) => {
            unsubscribe()
            resolve(user?.uid ?? null)
          })
        } else {
          resolve(userId)
        }
      })
    })
  }
}

FirebaseServices.onAuthStateChanged((user) => {
  if (user) {
    LocalStorageUserIdCache.setSignInUser(user.uid)
  } else {
    LocalStorageUserIdCache.setSignOut()
  }
})
