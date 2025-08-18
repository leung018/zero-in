import { beforeEach, describe } from 'vitest'
import { FakeObservableStorage } from '../../infra/storage/fake'
import { runDailyResetTimeStorageServiceTests } from './storage_shared_spec'

describe('DailyResetTimeStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runDailyResetTimeStorageServiceTests(storage)
})
