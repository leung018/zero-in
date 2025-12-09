import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { runWeeklyScheduleStorageServiceTests } from '@zero-in/shared/domain/schedules/storage-shared-spec'
import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test-utils/firestore'

describe('WeeklyScheduleStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(WeeklySchedulesStorageService.STORAGE_KEY)
  })

  runWeeklyScheduleStorageServiceTests(firestoreStorage)
})
