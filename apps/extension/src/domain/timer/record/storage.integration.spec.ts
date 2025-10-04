import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../../test-utils/firestore'
import { FocusSessionRecordsStorageService } from './storage'
import { runFocusSessionRecordsStorageServiceTests } from './storage-shared-spec'

describe('FocusSessionRecordsStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(FocusSessionRecordsStorageService.STORAGE_KEY)
  })

  runFocusSessionRecordsStorageServiceTests(firestoreStorage)
})
