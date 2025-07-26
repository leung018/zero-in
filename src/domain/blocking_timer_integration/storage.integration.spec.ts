import { beforeEach, describe } from 'vitest'
import { newTestFirestoreStorage } from '../../test_utils/firestore'
import { BlockingTimerIntegrationStorageService } from './storage'
import { runBlockingTimerIntegrationStorageServiceTests } from './storage_test'

describe('BlockingTimerIntegrationStorageService', async () => {
  const firestoreStorage = await newTestFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(BlockingTimerIntegrationStorageService.STORAGE_KEY)
  })

  runBlockingTimerIntegrationStorageServiceTests(firestoreStorage)
})
