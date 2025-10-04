import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local-storage'
import { runBrowsingRulesStorageServiceTests } from './storage-shared-spec'

describe('BrowsingRulesStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runBrowsingRulesStorageServiceTests(storage)
})
