import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../../test_utils/firestore'
import { FocusSessionRecordsStorageService } from './storage'
import { runFocusSessionRecordsStorageServiceTests } from './storage_shared_spec'

describe('FocusSessionRecordsStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(FocusSessionRecordsStorageService.STORAGE_KEY)
  })

  runFocusSessionRecordsStorageServiceTests(firestoreStorage)
})
