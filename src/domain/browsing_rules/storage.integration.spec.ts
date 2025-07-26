import { beforeEach, describe } from 'vitest'
import { FirebaseServices } from '../../infra/firebase_services'
import { BrowsingRulesStorageService } from './storage'
import { runBrowsingRulesStorageServiceTests } from './storage_test'

describe('BrowsingRulesStorageService', async () => {
  // @ts-expect-error Exposed method
  await globalThis.signInWithTestCredential()
  const firebaseStorage = await FirebaseServices.getFirestoreStorage()

  beforeEach(async () => {
    return firebaseStorage.delete(BrowsingRulesStorageService.STORAGE_KEY)
  })

  runBrowsingRulesStorageServiceTests(firebaseStorage)
})
