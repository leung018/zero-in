import type { NotificationSetting } from '.'
import { ChromeStorageProvider } from '../../infra/chrome/storage'
import config from '../../config'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'
import type { SerializedNotificationSetting } from './serialize'

const STORAGE_KEY = 'notificationSetting'

export class NotificationSettingStorageService {
  static create() {
    return new NotificationSettingStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new NotificationSettingStorageService(new FakeStorage())
  }

  private storageWrapper: StorageWrapper<SerializedNotificationSetting>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: STORAGE_KEY,
      migrators: []
    })
  }

  async get(): Promise<NotificationSetting> {
    const result = await this.storageWrapper.get()
    if (result) {
      return result
    }
    return config.getDefaultNotificationSetting()
  }

  async save(notificationSetting: NotificationSetting): Promise<void> {
    return this.storageWrapper.set(notificationSetting)
  }
}
