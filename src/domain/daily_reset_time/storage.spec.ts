import { beforeEach, describe } from 'vitest'
import { FakeObservableStorage } from '../../infra/storage/local_storage_wrapper'
import { runDailyResetTimeStorageServiceTests } from './storage_shared_spec'

describe('DailyResetTimeStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runDailyResetTimeStorageServiceTests(storage)
})
