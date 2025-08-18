import { beforeEach, describe } from 'vitest'
import { FakeObservableStorage } from '../../infra/storage/fake'
import { runNotificationSettingStorageServiceTests } from './storage_shared_spec'

describe('NotificationSettingStorageService', () => {
  let storage = FakeObservableStorage.create()

  beforeEach(() => {
    storage = FakeObservableStorage.create()
  })

  runNotificationSettingStorageServiceTests(storage)
})
