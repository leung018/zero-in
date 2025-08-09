import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'
import { BlockingTimerIntegrationStorageService } from './storage'
import { runBlockingTimerIntegrationStorageServiceTests } from './storage_shared_spec'

describe('BlockingTimerIntegrationStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(BlockingTimerIntegrationStorageService.STORAGE_KEY)
  })

  runBlockingTimerIntegrationStorageServiceTests(firestoreStorage)
})
