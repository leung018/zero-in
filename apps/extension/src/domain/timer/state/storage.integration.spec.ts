import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../../test-utils/firestore'
import { TimerStateStorageService } from './storage'
import { runTimerStateStorageServiceTests } from './storage-shared-spec'

describe('TimerStateStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerStateStorageService.STORAGE_KEY)
  })

  runTimerStateStorageServiceTests(firestoreStorage)
})
