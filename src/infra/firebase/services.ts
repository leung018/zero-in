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
  onSnapshot,
  setDoc
} from 'firebase/firestore'
import { StorageInterface } from '../storage/interface'
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

onAuthStateChanged(auth, (user) => {
  if (user) {
    LocalStorageUserIdCache.setSignInUser(user.uid)
  } else {
    LocalStorageUserIdCache.setSignOut()
  }
})

async function getCurrentUserId(): Promise<string | null> {
  return new Promise((resolve) => {
    return LocalStorageUserIdCache.get().then(({ userId, isCacheSet }) => {
      if (!isCacheSet) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe()
          resolve(user?.uid ?? null)
        })
      } else {
        resolve(userId)
      }
    })
  })
}

export class FirebaseServices {
  static async signOut() {
    await signOut(auth)
    await LocalStorageUserIdCache.setSignOut()
  }

  static async isAuthenticated(): Promise<boolean> {
    const userId = await getCurrentUserId()
    return userId !== null
  }

  static async signInWithToken(token: string) {
    await setPersistence(auth, browserLocalPersistence)
    const credential = await signInWithCredential(auth, GoogleAuthProvider.credential(token))
    await LocalStorageUserIdCache.setSignInUser(credential.user.uid)
  }

  static async getFirestoreStorage(): Promise<FirestoreStorage> {
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }
    return new FirestoreStorage(userId)
  }
}

export class FirestoreStorage implements StorageInterface {
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
