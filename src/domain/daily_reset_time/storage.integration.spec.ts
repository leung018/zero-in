import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'
import { DailyResetTimeStorageService } from './storage'
import { runDailyResetTimeStorageServiceTests } from './storage_shared_spec'

describe('DailyResetTimeStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(DailyResetTimeStorageService.STORAGE_KEY)
  })

  runDailyResetTimeStorageServiceTests(firestoreStorage)
})
