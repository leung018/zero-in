import { beforeEach, describe } from 'vitest'
import { newTestFirestoreStorage } from '../../test_utils/firestore'
import { NotificationSettingStorageService } from './storage'
import { runNotificationSettingStorageServiceTests } from './storage_test'

describe('NotificationSettingStorageService', async () => {
  const firestoreStorage = await newTestFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(NotificationSettingStorageService.STORAGE_KEY)
  })

  runNotificationSettingStorageServiceTests(firestoreStorage)
})
