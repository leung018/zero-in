import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'
import { TimerBasedBlockingRulesStorageService } from './storage'
import { runTimerBasedBlockingRulesStorageServiceTests } from './storage_shared_spec'

describe('TimerBasedBlockingRulesStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerBasedBlockingRulesStorageService.STORAGE_KEY)
  })

  runTimerBasedBlockingRulesStorageServiceTests(firestoreStorage)
})
