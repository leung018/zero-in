import { beforeEach, describe } from 'vitest'
import { FakeObservableStorage } from '../../../infra/storage/fake'
import { runTimerConfigStorageServiceTests } from './storage-shared-spec'

describe('TimerConfigStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runTimerConfigStorageServiceTests(storage)
})
