import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test_utils/firestore'
import { BrowsingRulesStorageService } from './storage'
import { runBrowsingRulesStorageServiceTests } from './storage_test'

describe('BrowsingRulesStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(BrowsingRulesStorageService.STORAGE_KEY)
  })

  runBrowsingRulesStorageServiceTests(firestoreStorage)
})
