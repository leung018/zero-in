import config from '@/config'
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
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc
} from 'firebase/firestore'
import { ObservableStorage } from '../storage/interface'
import { LocalStorageUserIdCache } from './local_storage_cache'

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
    await setPersistence(auth, browserLocalPersistence)
    const credential = await signInWithCredential(auth, GoogleAuthProvider.credential(token))
    await LocalStorageUserIdCache.setSignInUser(credential.user.uid)
  }

  static async getFirestoreStorage(): Promise<FirestoreStorage> {
    const userId = await this.getCurrentUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }
    return new FirestoreStorage(userId)
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
    console.log('User signed in', user)
    LocalStorageUserIdCache.setSignInUser(user.uid)
  } else {
    console.log('User signed out')
    LocalStorageUserIdCache.setSignOut()
  }
})

export class FirestoreStorage implements ObservableStorage {
  constructor(public readonly userId: string) {}

  async set(key: string, value: any): Promise<void> {
    await setDoc(this.getDocRef(key), value)
  }

  async get(key: string): Promise<any> {
    const docSnap = await getDoc(this.getDocRef(key))
    return docSnap.data()
  }

  async delete(key: string): Promise<void> {
    await deleteDoc(this.getDocRef(key))
  }

  async onChange(key: string, callback: (data: any) => void) {
    return onSnapshot(this.getDocRef(key), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data())
      }
    })
  }

  private getDocRef(key: string) {
    return doc(db, 'users', this.userId, 'application', key)
  }
}
