import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local_storage_wrapper'
import { runNotificationSettingStorageServiceTests } from './storage_shared_spec'

describe('NotificationSettingStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runNotificationSettingStorageServiceTests(storage)
})
