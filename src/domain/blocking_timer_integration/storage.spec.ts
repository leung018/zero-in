import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage_wrapper'
import { runBlockingTimerIntegrationStorageServiceTests } from './storage_test'

describe('BlockingTimerIntegrationStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runBlockingTimerIntegrationStorageServiceTests(storage)
})
