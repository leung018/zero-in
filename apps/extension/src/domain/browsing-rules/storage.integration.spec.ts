import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../test-utils/firestore'
import { BrowsingRulesStorageService } from './storage'
import { runBrowsingRulesStorageServiceTests } from './storage-shared-spec'

describe('BrowsingRulesStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(BrowsingRulesStorageService.STORAGE_KEY)
  })

  runBrowsingRulesStorageServiceTests(firestoreStorage)
})
