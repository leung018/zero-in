import { TimerStateStorageService } from '@zero-in/shared/domain/timer/state/storage'
import { runTimerStateStorageServiceTests } from '@zero-in/shared/domain/timer/state/storage-shared-spec'
import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../../test-utils/firestore'

describe('TimerStateStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerStateStorageService.STORAGE_KEY)
  })

  runTimerStateStorageServiceTests(firestoreStorage)
})
