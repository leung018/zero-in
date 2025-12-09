import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { beforeEach, describe } from 'vitest'
import { runBrowsingRulesStorageServiceTests } from './storage-shared-spec'

describe('BrowsingRulesStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runBrowsingRulesStorageServiceTests(storage)
})
