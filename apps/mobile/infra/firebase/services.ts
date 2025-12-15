import { getAuth } from '@react-native-firebase/auth'
import { getFirestore } from '@react-native-firebase/firestore'
import { FirestoreAppStorage } from '@zero-in/shared/infra/storage/firebase/firestore/app-storage'
import { ReactNativeFirestoreAdapter } from './react-native-firestore-adapter'

const auth = getAuth()
const firestore = getFirestore()

export class FirebaseServices {
  static async getFirestoreAppStorage(): Promise<FirestoreAppStorage> {
    const userId = auth.currentUser?.uid
    if (!userId) {
      throw new Error('User not authenticated')
    }
    return new FirestoreAppStorage(userId, new ReactNativeFirestoreAdapter(firestore))
  }
}
