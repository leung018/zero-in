import { beforeEach, describe } from 'vitest'
import { WeeklySchedulesStorageService } from '../../../../shared/src/domain/schedules/storage'
import { runWeeklyScheduleStorageServiceTests } from '../../../../shared/src/domain/schedules/storage_shared_spec'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'

describe('WeeklyScheduleStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(WeeklySchedulesStorageService.STORAGE_KEY)
  })

  runWeeklyScheduleStorageServiceTests(firestoreStorage)
})
