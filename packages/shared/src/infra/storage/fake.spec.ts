import { describe } from 'vitest'
import { FakeRemoteStorage } from './fake'
import { testRemoteStorageContract } from './remote-storage.contract'

describe('FakeRemoteStorage', () => {
  testRemoteStorageContract(async () => FakeRemoteStorage.create())
})
