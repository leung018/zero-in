import { beforeEach, describe } from 'vitest'
import { LocalStorageWrapper } from '../../infra/storage/local-storage'
import { runNotificationSettingStorageServiceTests } from './storage-shared-spec'

describe('NotificationSettingStorageService', () => {
  let storage = LocalStorageWrapper.createFake()

  beforeEach(() => {
    storage = LocalStorageWrapper.createFake()
  })

  runNotificationSettingStorageServiceTests(storage)
})
