import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../../test-utils/firestore'
import { TimerStateStorageService } from './storage'
import { runTimerStateStorageServiceTests } from './storage-shared-spec'

describe('TimerStateStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerStateStorageService.STORAGE_KEY)
  })

  runTimerStateStorageServiceTests(firestoreStorage)
})
