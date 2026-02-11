import { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { runFocusSessionRecordsStorageServiceTests } from '@zero-in/shared/domain/timer/record/storage-shared-spec'
import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../../test-utils/firestore'

describe('FocusSessionRecordsStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(FocusSessionRecordsStorageService.STORAGE_KEY)
  })

  runFocusSessionRecordsStorageServiceTests(firestoreStorage)
})
