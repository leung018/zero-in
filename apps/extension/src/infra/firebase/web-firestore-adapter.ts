import {
  FirestoreAdapter,
  FirestoreDocumentReference,
  FirestoreDocumentSnapshot
} from '@zero-in/shared/infra/storage/firebase/firestore/adapter'
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
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
    return toSnapshot(snapshot)
  }

  async getDocs(path: string, ...pathSegments: string[]): Promise<FirestoreDocumentSnapshot[]> {
    const snapshot = await getDocs(collection(this.firestore, path, ...pathSegments))
    return snapshot.docs.map(toSnapshot)
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
    return onSnapshot(docRef, (snapshot: RawDocumentSnapshot) => {
      callback(toSnapshot(snapshot))
    })
  }
}

interface RawDocumentSnapshot {
  id: string
  exists(): boolean
  data(): any
}

function toSnapshot(snapshot: RawDocumentSnapshot): FirestoreDocumentSnapshot {
  return {
    id: snapshot.id,
    exists: () => snapshot.exists(),
    data: () => snapshot.data()
  }
}
