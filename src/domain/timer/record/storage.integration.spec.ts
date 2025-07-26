import { beforeEach, describe } from 'vitest'
import { newTestFirestoreStorage } from '../../../test_utils/firestore'
import { FocusSessionRecordStorageService } from './storage'
import { runFocusSessionRecordStorageServiceTests } from './storage_test'

describe('FocusSessionRecordStorageService', async () => {
  const firestoreStorage = await newTestFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(FocusSessionRecordStorageService.STORAGE_KEY)
  })

  runFocusSessionRecordStorageServiceTests(firestoreStorage)
})
