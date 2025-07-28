import { beforeEach, describe } from 'vitest'
import { newTestFirestoreStorage } from '../../test_utils/firestore'
import { DailyResetTimeStorageService } from './storage'
import { runDailyResetTimeStorageServiceTests } from './storage_test'

describe('DailyResetTimeStorageService', async () => {
  const firestoreStorage = await newTestFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(DailyResetTimeStorageService.STORAGE_KEY)
  })

  runDailyResetTimeStorageServiceTests(firestoreStorage)
})
