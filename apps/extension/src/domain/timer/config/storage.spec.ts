import { beforeEach, describe } from 'vitest'
import { FakeObservableStorage } from '../../../infra/storage/fake'
import { runTimerConfigStorageServiceTests } from './storage_shared_spec'

describe('TimerConfigStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runTimerConfigStorageServiceTests(storage)
})
