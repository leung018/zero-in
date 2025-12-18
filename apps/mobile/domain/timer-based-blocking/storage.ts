import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { FirestoreAppStorageWrapper } from '../../infra/firebase/storage/firestore'

export function newTimerBasedBlockingRulesStorageService() {
  return new TimerBasedBlockingRulesStorageService(FirestoreAppStorageWrapper.create())
}
