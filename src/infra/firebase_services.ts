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
  signOut,
  User
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

let currentUser: User | null = null
let authStateResolved = false

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
  currentUser = user
  authStateResolved = true
})

async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    if (authStateResolved) {
      resolve(currentUser)
    } else {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user)
      })
    }
  })
}

export class FirebaseServices {
  static signOut() {
    return signOut(auth)
  }

  static async isAuthenticated(): Promise<boolean> {
    const currentUser = await getCurrentUser()
    return currentUser !== null
  }

  static async signInWithToken(token: string) {
    const credential = GoogleAuthProvider.credential(token)
    await setPersistence(auth, browserLocalPersistence)
    await signInWithCredential(auth, credential)
  }

  static async getFirestoreStorage(): Promise<FirestoreStorage> {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('User not authenticated')
    }
    return new FirestoreStorage(currentUser.uid)
  }
}

class FirestoreStorage implements StorageInterface {
  constructor(private userId: string) {}

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
