import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { beforeEach, describe } from 'vitest'
import { runNotificationSettingStorageServiceTests } from './storage-shared-spec'

describe('NotificationSettingStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runNotificationSettingStorageServiceTests(storage)
})
