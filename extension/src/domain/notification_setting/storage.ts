import type { NotificationSetting } from '.'
import config from '../../config'
import { StorageInterface, StorageService } from '../../infra/storage/interface'
import { StorageKey } from '../../infra/storage/key'
import { StorageManager } from '../../infra/storage/manager'
import type { SerializedNotificationSetting } from './serialize'

export class NotificationSettingStorageService implements StorageService<NotificationSetting> {
  static readonly STORAGE_KEY: StorageKey = 'notificationSetting'

  private storageManager: StorageManager<SerializedNotificationSetting>

  constructor(storage: StorageInterface) {
    this.storageManager = StorageManager.create({
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
