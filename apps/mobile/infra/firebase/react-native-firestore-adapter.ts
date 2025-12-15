import {
  deleteDoc,
  doc,
  FirebaseFirestoreTypes,
  getDoc,
  onSnapshot,
  setDoc
} from '@react-native-firebase/firestore'
import {
  FirestoreAdapter,
  FirestoreDocumentReference,
  FirestoreDocumentSnapshot
} from '@zero-in/shared/infra/storage/firebase/firestore/adapter'

export class ReactNativeFirestoreAdapter implements FirestoreAdapter {
  constructor(private readonly firestore: FirebaseFirestoreTypes.Module) {}

  doc(...segments: string[]) {
    return (
      doc as (
        firestore: FirebaseFirestoreTypes.Module,
        ...pathSegments: string[]
      ) => FirebaseFirestoreTypes.DocumentReference
    )(this.firestore, ...segments)
  }

  async getDoc(docRef: FirestoreDocumentReference) {
    const snapshot = await getDoc(docRef)
    return {
      exists: () => snapshot.exists(),
      data: () => snapshot.data()
    }
  }

  async setDoc(docRef: FirestoreDocumentReference, data: any): Promise<void> {
    await setDoc(docRef as FirebaseFirestoreTypes.DocumentReference, data)
  }

  async deleteDoc(docRef: FirestoreDocumentReference): Promise<void> {
    await deleteDoc(docRef as FirebaseFirestoreTypes.DocumentReference)
  }

  onSnapshot(
    docRef: FirestoreDocumentReference,
    callback: (snapshot: FirestoreDocumentSnapshot) => void
  ): () => void {
    return onSnapshot(
      docRef as FirebaseFirestoreTypes.DocumentReference,
      (snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => {
        callback({
          exists: () => snapshot.exists(),
          data: () => snapshot.data()
        })
      }
    )
  }
}
