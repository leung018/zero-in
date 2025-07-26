import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage_wrapper'
import { runTimerConfigStorageServiceTests } from './storage_test'

describe('TimerConfigStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runTimerConfigStorageServiceTests(storage)
})
