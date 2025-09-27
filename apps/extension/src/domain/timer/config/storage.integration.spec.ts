import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../../test_utils/firestore'
import { TimerConfigStorageService } from './storage'
import { runTimerConfigStorageServiceTests } from './storage_shared_spec'

describe('TimerConfigStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerConfigStorageService.STORAGE_KEY)
  })

  runTimerConfigStorageServiceTests(firestoreStorage)
})
