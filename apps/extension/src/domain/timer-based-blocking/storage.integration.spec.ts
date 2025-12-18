import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { runTimerBasedBlockingRulesStorageServiceTests } from '@zero-in/shared/domain/timer-based-blocking/storage-shared-spec'
import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../test-utils/firestore'

describe('TimerBasedBlockingRulesStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerBasedBlockingRulesStorageService.STORAGE_KEY)
  })

  runTimerBasedBlockingRulesStorageServiceTests(firestoreStorage)
})
