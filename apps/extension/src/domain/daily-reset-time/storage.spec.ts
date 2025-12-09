import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { beforeEach, describe } from 'vitest'
import { runDailyResetTimeStorageServiceTests } from './storage-shared-spec'

describe('DailyResetTimeStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runDailyResetTimeStorageServiceTests(storage)
})
