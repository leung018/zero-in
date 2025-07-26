import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage_wrapper'
import { runBrowsingRulesStorageServiceTests } from './storage_test'

describe('BrowsingRulesStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runBrowsingRulesStorageServiceTests(storage)
})
