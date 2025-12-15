import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../test-utils/firestore'
import { DailyResetTimeStorageService } from './storage'
import { runDailyResetTimeStorageServiceTests } from './storage-shared-spec'

describe('DailyResetTimeStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(DailyResetTimeStorageService.STORAGE_KEY)
  })

  runDailyResetTimeStorageServiceTests(firestoreStorage)
})
