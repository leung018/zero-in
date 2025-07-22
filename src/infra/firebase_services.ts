import config from '@/config'
import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  signOut,
  User
} from 'firebase/auth'

const app = initializeApp(config.getFirebaseConfig())

let currentUser: User | null = null
let authStateResolved = false

const auth = getAuth(app)

onAuthStateChanged(auth, (user) => {
  currentUser = user
  authStateResolved = true
})

// Require manual testing
export class FirebaseServices {
  static signOut() {
    return signOut(auth)
  }

  static async getCurrentUser(): Promise<User | null> {
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

  static async signInWithToken(oauthIdToken: string) {
    const credential = GoogleAuthProvider.credential(oauthIdToken)
    await setPersistence(auth, browserLocalPersistence)
    await signInWithCredential(auth, credential)
  }
}
