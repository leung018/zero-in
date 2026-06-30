import { FakeRemoteStorage } from '@zero-in/shared/infra/storage/fake'
import { beforeEach, describe } from 'vitest'
import { runTimerConfigStorageServiceTests } from './storage-shared-spec'

describe('TimerConfigStorageService', () => {
  let storage = FakeRemoteStorage.create()

  beforeEach(() => {
    storage = FakeRemoteStorage.create()
  })

  runTimerConfigStorageServiceTests(storage)
})
