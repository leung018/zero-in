import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'
import { WeeklyScheduleStorageService } from './storage'
import { runWeeklyScheduleStorageServiceTests } from './storage_shared_spec'

describe('WeeklyScheduleStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(WeeklyScheduleStorageService.STORAGE_KEY)
  })

  runWeeklyScheduleStorageServiceTests(firestoreStorage)
})
