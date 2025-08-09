import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../../test_utils/firestore'
import { FocusSessionRecordStorageService } from './storage'
import { runFocusSessionRecordStorageServiceTests } from './storage_shared_spec'

describe('FocusSessionRecordStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(FocusSessionRecordStorageService.STORAGE_KEY)
  })

  runFocusSessionRecordStorageServiceTests(firestoreStorage)
})
