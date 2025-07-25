import type { NotificationSetting } from '.'
import config from '../../config'
import { BrowserStorageProvider } from '../../infra/browser/storage'
import { FakeLocalStorage, StorageManager, type LocalStorage } from '../../infra/storage'
import type { SerializedNotificationSetting } from './serialize'

export class NotificationSettingStorageService {
  static readonly STORAGE_KEY = 'notificationSetting'

  static create() {
    return new NotificationSettingStorageService(BrowserStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new NotificationSettingStorageService(new FakeLocalStorage())
  }

  private storageManager: StorageManager<SerializedNotificationSetting>

  private constructor(storage: LocalStorage) {
    this.storageManager = new StorageManager({
      storage,
      key: NotificationSettingStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async get(): Promise<NotificationSetting> {
    const result = await this.storageManager.get()
    if (result) {
      return result
    }
    return config.getDefaultNotificationSetting()
  }

  async save(notificationSetting: NotificationSetting): Promise<void> {
    return this.storageManager.set(notificationSetting)
  }
}
