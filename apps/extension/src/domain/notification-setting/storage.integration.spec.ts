import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreStorage } from '../../test-utils/firestore'
import { NotificationSettingStorageService } from './storage'
import { runNotificationSettingStorageServiceTests } from './storage-shared-spec'

describe('NotificationSettingStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(NotificationSettingStorageService.STORAGE_KEY)
  })

  runNotificationSettingStorageServiceTests(firestoreStorage)
})
