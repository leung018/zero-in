import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth'
import config from './config'

const app = initializeApp(config.getFirebaseConfig())

export const myGetAuth = () => {
  return getAuth(app)
}

let currentUser: User | null = null
let authStateResolved = false

const auth = myGetAuth()

onAuthStateChanged(auth, (user) => {
  currentUser = user
  authStateResolved = true
})

export async function getCurrentUser(): Promise<User | null> {
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

export async function mySignOut() {
  return signOut(auth)
}
