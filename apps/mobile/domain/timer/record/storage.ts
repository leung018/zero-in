import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { FirestoreAppStorageWrapper } from '../../../infra/firebase/storage/firestore'

export function newFocusSessionRecordsStorageService(): FocusSessionRecordsStorageService {
  return new FocusSessionRecordsStorageService(FirestoreAppStorageWrapper.create())
}
