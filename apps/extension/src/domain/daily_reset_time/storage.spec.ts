import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { runDailyResetTimeStorageServiceTests } from './storage_shared_spec'

describe('DailyResetTimeStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runDailyResetTimeStorageServiceTests(storage)
})
