import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test-utils/firestore'
import { WeeklySchedulesStorageService } from './storage'
import { runWeeklyScheduleStorageServiceTests } from './storage-shared-spec'

describe('WeeklyScheduleStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(WeeklySchedulesStorageService.STORAGE_KEY)
  })

  runWeeklyScheduleStorageServiceTests(firestoreStorage)
})
