import { WeeklySchedulesStorageService } from '../../../../packages/shared/src/domain/schedules/storage'
import { FirestoreAppStorageWrapper } from '../../infra/firebase/storage/firestore'

export function newWeeklySchedulesStorageService() {
  return new WeeklySchedulesStorageService(FirestoreAppStorageWrapper.create())
}
