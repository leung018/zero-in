import type { NotificationSetting } from '.'
import { StorageInterface, StorageService } from '../../../../shared/src/infra/storage/interface'
import config from '../../config'
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
