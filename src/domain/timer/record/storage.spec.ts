import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage_wrapper'
import { runFocusSessionRecordStorageServiceTests } from './storage_test'
describe('FocusSessionRecordStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runFocusSessionRecordStorageServiceTests(storage)
})
