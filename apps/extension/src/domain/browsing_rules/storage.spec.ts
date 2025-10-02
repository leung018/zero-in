import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { runBrowsingRulesStorageServiceTests } from './storage_shared_spec'

describe('BrowsingRulesStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runBrowsingRulesStorageServiceTests(storage)
})
