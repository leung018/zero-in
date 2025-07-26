import { beforeEach, describe } from 'vitest'
import { newTestFirestoreStorage } from '../../../test_utils/firestore'
import { TimerConfigStorageService } from './storage'
import { runTimerConfigStorageServiceTests } from './storage_test'

describe('TimerConfigStorageService', async () => {
  const firestoreStorage = await newTestFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(TimerConfigStorageService.STORAGE_KEY)
  })

  runTimerConfigStorageServiceTests(firestoreStorage)
})
