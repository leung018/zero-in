import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../../test_utils/firestore'
import { TimerStateStorageService } from './storage'
import { runTimerStateStorageServiceTests } from './storage_shared_spec'

describe('TimerStateStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerStateStorageService.STORAGE_KEY)
  })

  runTimerStateStorageServiceTests(firestoreStorage)
})
