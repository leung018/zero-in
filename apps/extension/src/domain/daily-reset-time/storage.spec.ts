import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local-storage'
import { runDailyResetTimeStorageServiceTests } from './storage-shared-spec'

describe('DailyResetTimeStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runDailyResetTimeStorageServiceTests(storage)
})
