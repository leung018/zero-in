import { beforeEach, describe } from 'vitest'
import { signInAndGetFirestoreAppStorage } from '../../test-utils/firestore'
import { NotificationSettingStorageService } from './storage'
import { runNotificationSettingStorageServiceTests } from './storage-shared-spec'

describe('NotificationSettingStorageService', async () => {
  const firestoreStorage = await signInAndGetFirestoreAppStorage()

  beforeEach(async () => {
    return firestoreStorage.delete(NotificationSettingStorageService.STORAGE_KEY)
  })

  runNotificationSettingStorageServiceTests(firestoreStorage)
})
