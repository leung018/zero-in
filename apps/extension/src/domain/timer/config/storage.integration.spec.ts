import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../../test-utils/firestore'
import { TimerConfigStorageService } from './storage'
import { runTimerConfigStorageServiceTests } from './storage-shared-spec'

describe('TimerConfigStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerConfigStorageService.STORAGE_KEY)
  })

  runTimerConfigStorageServiceTests(firestoreStorage)
})
