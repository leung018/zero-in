import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../../test-utils/firestore'
import { FocusSessionRecordsStorageService } from './storage'
import { runFocusSessionRecordsStorageServiceTests } from './storage-shared-spec'

describe('FocusSessionRecordsStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(FocusSessionRecordsStorageService.STORAGE_KEY)
  })

  runFocusSessionRecordsStorageServiceTests(firestoreStorage)
})
