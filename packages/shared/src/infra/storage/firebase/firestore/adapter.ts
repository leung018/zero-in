/**
 * Adapter interface for Firestore operations that abstracts differences
 * between web Firebase (firebase/firestore) and React Native Firebase
 * (@react-native-firebase/firestore)
 */
export interface FirestoreAdapter {
  doc(path: string, ...pathSegments: string[]): FirestoreDocumentReference

  getDoc(docRef: FirestoreDocumentReference): Promise<FirestoreDocumentSnapshot>

  setDoc(docRef: FirestoreDocumentReference, data: any): Promise<void>

  deleteDoc(docRef: FirestoreDocumentReference): Promise<void>

  onSnapshot(
    docRef: FirestoreDocumentReference,
    callback: (snapshot: FirestoreDocumentSnapshot) => void
  ): Unsubscribe
}

type Unsubscribe = () => void

export type FirestoreDocumentReference = any // TODO: Use stricter type if possible

export interface FirestoreDocumentSnapshot {
  exists(): boolean
  data(): any
}
