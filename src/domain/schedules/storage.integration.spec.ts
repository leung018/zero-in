import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'
import { WeeklySchedulesStorageService } from './storage'
import { runWeeklyScheduleStorageServiceTests } from './storage_shared_spec'

describe('WeeklyScheduleStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(WeeklySchedulesStorageService.STORAGE_KEY)
  })

  runWeeklyScheduleStorageServiceTests(firestoreStorage)
})
