import { beforeEach, describe } from 'vitest'
import { FirebaseServices } from '../../infra/firebase_services'
import { BlockingTimerIntegrationStorageService } from './storage'
import { runBlockingTimerIntegrationStorageServiceTests } from './storage_test'

describe('BlockingTimerIntegrationStorageService', async () => {
  // @ts-expect-error Exposed method
  await globalThis.signInWithTestCredential()
  const firebaseStorage = await FirebaseServices.getFirestoreStorage()

  beforeEach(async () => {
    return firebaseStorage.delete(BlockingTimerIntegrationStorageService.STORAGE_KEY)
  })

  runBlockingTimerIntegrationStorageServiceTests(firebaseStorage)
})
