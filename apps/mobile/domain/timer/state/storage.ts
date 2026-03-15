import { TimerStateStorageService } from '@zero-in/shared/domain/timer/state/storage'
import { FirestoreAppStorageWrapper } from '../../../infra/firebase/storage/firestore'

export function newTimerStateStorageService(): TimerStateStorageService {
  return new TimerStateStorageService(FirestoreAppStorageWrapper.create())
}
