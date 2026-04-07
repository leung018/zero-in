import {
  FirestoreAdapter,
  FirestoreDocumentReference,
  FirestoreDocumentSnapshot
} from '@zero-in/shared/infra/storage/firebase/firestore/adapter'
import {
  deleteDoc,
  doc,
  DocumentSnapshot,
  Firestore,
  getDoc,
  onSnapshot,
  setDoc
} from 'firebase/firestore'

export class WebFirestoreAdapter implements FirestoreAdapter {
  constructor(private readonly firestore: Firestore) {}

  doc(path: string, ...pathSegments: string[]) {
    return doc(this.firestore, path, ...pathSegments)
  }

  async getDoc(docRef: FirestoreDocumentReference) {
    const snapshot = await getDoc(docRef)
    return {
      exists: () => snapshot.exists(),
      data: () => snapshot.data()
    }
  }

  async setDoc(docRef: FirestoreDocumentReference, data: any): Promise<void> {
    await setDoc(docRef, data)
  }

  async deleteDoc(docRef: FirestoreDocumentReference): Promise<void> {
    await deleteDoc(docRef)
  }

  onSnapshot(
    docRef: FirestoreDocumentReference,
    callback: (snapshot: FirestoreDocumentSnapshot) => void
  ): () => void {
    return onSnapshot(docRef, (snapshot: DocumentSnapshot) => {
      callback({
        exists: () => snapshot.exists(),
        data: () => snapshot.data()
      })
    })
  }
}
