import config from '@/config'
import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  signOut
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc
} from 'firebase/firestore'
import { StorageInterface } from './storage/interface'

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

onAuthStateChanged(auth, (user) => {
  if (user) {
    LocalStorageUserIdCache.setSignInUser(user.uid)
  } else {
    LocalStorageUserIdCache.setSignOut()
  }
})

async function getCurrentUserId(): Promise<string | null> {
  return new Promise((resolve) => {
    const { userId, isCacheSet } = LocalStorageUserIdCache.get()
    if (!isCacheSet) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user?.uid ?? null)
      })
    } else {
      resolve(userId)
    }
  })
}

class LocalStorageUserIdCache {
  private static KEY = 'authenticatedUserId'

  static get(): {
    userId: string | null
    isCacheSet: boolean
  } {
    const userId = localStorage.getItem(this.KEY)
    return {
      userId: userId === '' ? null : userId,
      isCacheSet: userId !== null
    }
  }

  static setSignInUser(userId: string): void {
    localStorage.setItem(this.KEY, userId)
  }

  static setSignOut(): void {
    localStorage.setItem(this.KEY, '')
  }
}

export class FirebaseServices {
  static signOut() {
    return signOut(auth).then(() => {
      LocalStorageUserIdCache.setSignOut()
    })
  }

  static async isAuthenticated(): Promise<boolean> {
    const userId = await getCurrentUserId()
    return userId !== null
  }

  static async signInWithToken(token: string) {
    await setPersistence(auth, browserLocalPersistence)
    const credential = await signInWithCredential(auth, GoogleAuthProvider.credential(token))
    LocalStorageUserIdCache.setSignInUser(credential.user.uid)
  }

  static async getFirestoreStorage(): Promise<FirestoreStorage> {
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }
    return new FirestoreStorage(userId)
  }
}

class FirestoreStorage implements StorageInterface {
  constructor(public readonly userId: string) {}

  async set(key: string, value: any): Promise<void> {
    await setDoc(doc(db, 'users', this.userId, 'application', key), value)
  }

  async get(key: string): Promise<any> {
    const docRef = doc(db, 'users', this.userId, 'application', key)
    const docSnap = await getDoc(docRef)
    return docSnap.data()
  }

  async delete(key: string): Promise<void> {
    const docRef = doc(db, 'users', this.userId, 'application', key)
    await deleteDoc(docRef)
  }
}
