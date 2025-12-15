import {
  FirestoreAdapter,
  FirestoreDocumentReference,
  FirestoreDocumentSnapshot
} from '@zero-in/shared/infra/storage/firebase/firestore/adapter'
import {
  deleteDoc,
  doc,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  getDoc,
  onSnapshot,
  setDoc
} from 'firebase/firestore'

export class WebFirestoreAdapter implements FirestoreAdapter {
  constructor(private readonly firestore: Firestore) {}

  doc(...segments: string[]) {
    return (doc as (firestore: Firestore, ...pathSegments: string[]) => DocumentReference)(
      this.firestore,
      ...segments
    )
  }

  async getDoc(docRef: FirestoreDocumentReference) {
    const snapshot = await getDoc(docRef)
    return {
      exists: () => snapshot.exists(),
      data: () => snapshot.data()
    }
  }

  async setDoc(docRef: FirestoreDocumentReference, data: any): Promise<void> {
    await setDoc(docRef as DocumentReference, data)
  }

  async deleteDoc(docRef: FirestoreDocumentReference): Promise<void> {
    await deleteDoc(docRef as DocumentReference)
  }

  onSnapshot(
    docRef: FirestoreDocumentReference,
    callback: (snapshot: FirestoreDocumentSnapshot) => void
  ): () => void {
    return onSnapshot(docRef as DocumentReference, (snapshot: DocumentSnapshot) => {
      callback({
        exists: () => snapshot.exists(),
        data: () => snapshot.data()
      })
    })
  }
}
