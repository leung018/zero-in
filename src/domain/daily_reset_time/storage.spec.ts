import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage_wrapper'
import { runDailyResetTimeStorageServiceTests } from './storage_test'

describe('DailyResetTimeStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runDailyResetTimeStorageServiceTests(storage)
})
