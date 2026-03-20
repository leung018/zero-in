import { TimerConfigStorageService } from '@zero-in/shared/domain/timer/config/storage'
import { FirestoreAppStorageWrapper } from '../../../infra/firebase/storage/firestore'

export function newTimerConfigStorageService() {
  return new TimerConfigStorageService(FirestoreAppStorageWrapper.create())
}
