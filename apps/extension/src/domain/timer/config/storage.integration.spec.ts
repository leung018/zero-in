import { TimerConfigStorageService } from '@zero-in/shared/domain/timer/config/storage'
import { runTimerConfigStorageServiceTests } from '@zero-in/shared/domain/timer/config/storage-shared-spec'
import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../../test-utils/firestore'

describe('TimerConfigStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerConfigStorageService.STORAGE_KEY)
  })

  runTimerConfigStorageServiceTests(firestoreStorage)
})
