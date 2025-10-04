import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test-utils/firestore'
import { TimerBasedBlockingRulesStorageService } from './storage'
import { runTimerBasedBlockingRulesStorageServiceTests } from './storage-shared-spec'

describe('TimerBasedBlockingRulesStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerBasedBlockingRulesStorageService.STORAGE_KEY)
  })

  runTimerBasedBlockingRulesStorageServiceTests(firestoreStorage)
})
