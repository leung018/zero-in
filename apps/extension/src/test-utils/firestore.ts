import { FirebaseServices } from '../infra/firebase/services'

/**
 * Sign in with test credentials and return a new FirestoreStorage instance.
 * Noted that only when env VITE_USE_FIREBASE_EMULATOR enabled, this function will work.
 */
export async function signInAndGetFirestoreStorage() {
  // @ts-expect-error Exposed method
  await globalThis.signInWithTestCredential()
  return FirebaseServices.getFirestoreStorage()
}
