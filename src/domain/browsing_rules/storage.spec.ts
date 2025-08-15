import { beforeEach, describe } from 'vitest'
import { FakeObservableStorage } from '../../infra/storage/local_storage_wrapper'
import { runBrowsingRulesStorageServiceTests } from './storage_shared_spec'

describe('BrowsingRulesStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runBrowsingRulesStorageServiceTests(storage)
})
