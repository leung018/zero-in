import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'
import { TimerBasedBlockingStorageService } from './storage'
import { runTimerBasedBlockingStorageServiceTests } from './storage_shared_spec'

describe('TimerBasedBlockingStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerBasedBlockingStorageService.STORAGE_KEY)
  })

  runTimerBasedBlockingStorageServiceTests(firestoreStorage)
})
