import { StorageInterface, StorageService } from '@zero-in/shared/infra/storage/interface'
import { StorageKey } from '@zero-in/shared/infra/storage/key'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { StorageManager } from '@zero-in/shared/infra/storage/manager'
import type { NotificationSetting } from '.'
import config from '../../config'
import { AdaptiveStorageProvider } from '../../infra/storage/adaptive'
import type { SerializedNotificationSetting } from './serialize'

export class NotificationSettingStorageService implements StorageService<NotificationSetting> {
  static readonly STORAGE_KEY: StorageKey = 'notificationSetting'

  static create() {
    return new NotificationSettingStorageService(AdaptiveStorageProvider.create())
  }

  static createFake() {
    return new NotificationSettingStorageService(LocalStorageWrapper.createFake())
  }

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
