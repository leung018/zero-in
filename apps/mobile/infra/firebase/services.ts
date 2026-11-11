import { getAuth } from '@react-native-firebase/auth'
import { getFirestore } from '@react-native-firebase/firestore'
import { FirestoreStorage } from '@zero-in/shared/infra/storage/firebase/firestore/storage'
import { ReactNativeFirestoreAdapter } from './react-native-firestore-adapter'

const auth = getAuth()
const firestore = getFirestore()

export class FirebaseServices {
  static async getFirestoreAppStorage(): Promise<FirestoreStorage> {
    return FirestoreStorage.createAppStorage({
      userId: this.requireUserId(),
      adapter: new ReactNativeFirestoreAdapter(firestore)
    })
  }

  static async getFirestoreTokenStorage(userId?: string): Promise<FirestoreStorage> {
    return FirestoreStorage.createTokenStorage({
      userId: userId ?? this.requireUserId(),
      adapter: new ReactNativeFirestoreAdapter(firestore)
    })
  }

  static async getAllFirestoreUserStorages(): Promise<FirestoreStorage[]> {
    return FirestoreStorage.createAllUserStorages({
      userId: this.requireUserId(),
      adapter: new ReactNativeFirestoreAdapter(firestore)
    })
  }

  static async getFirestoreDeletionMarkerStorage(): Promise<FirestoreStorage> {
    return FirestoreStorage.createDeletionMarkerStorage({
      adapter: new ReactNativeFirestoreAdapter(firestore)
    })
  }

  private static requireUserId(): string {
    const userId = auth.currentUser?.uid
    if (!userId) {
      throw new Error('User not authenticated')
    }
    return userId
  }
}
