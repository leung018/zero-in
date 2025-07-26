import { beforeEach, describe } from 'vitest'
import { newTestFirestoreStorage } from '../../test_utils/firestore'
import { BrowsingRulesStorageService } from './storage'
import { runBrowsingRulesStorageServiceTests } from './storage_test'

describe('BrowsingRulesStorageService', async () => {
  const firestoreStorage = await newTestFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(BrowsingRulesStorageService.STORAGE_KEY)
  })

  runBrowsingRulesStorageServiceTests(firestoreStorage)
})
