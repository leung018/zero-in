import { beforeEach, describe } from 'vitest'
import { FakeObservableStorage } from '../../infra/storage/fake'
import { runBrowsingRulesStorageServiceTests } from './storage_shared_spec'

describe('BrowsingRulesStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runBrowsingRulesStorageServiceTests(storage)
})
