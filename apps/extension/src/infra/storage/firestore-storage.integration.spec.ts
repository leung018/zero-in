import { testRemoteStorageContract } from '@zero-in/shared/infra/storage/remote-storage.contract'
import { describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../test-utils/firestore'

describe('FirestoreStorage', () => {
  testRemoteStorageContract(signInAndGetFirestoreAppStorage)
})
