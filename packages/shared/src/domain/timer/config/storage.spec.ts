import { FakeObservableStorage } from '@zero-in/shared/infra/storage/fake'
import { beforeEach, describe } from 'vitest'
import { runTimerConfigStorageServiceTests } from './storage-shared-spec'

describe('TimerConfigStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runTimerConfigStorageServiceTests(storage)
})
