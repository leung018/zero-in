import type { NotificationSetting } from '.'
import config from '../../config'
import { FakeObservableStorage } from '../../infra/storage/fake'
import { ObservableStorage } from '../../infra/storage/interface'
import { StorageManager } from '../../infra/storage/manager'
import { AdaptiveStorageProvider } from '../../infra/storage/provider'
import type { SerializedNotificationSetting } from './serialize'

export class NotificationSettingStorageService {
  static readonly STORAGE_KEY = 'notificationSetting'

  static create() {
    return new NotificationSettingStorageService(AdaptiveStorageProvider.create())
  }

  static createFake() {
    return new NotificationSettingStorageService(FakeObservableStorage.create())
  }

  private storageManager: StorageManager<SerializedNotificationSetting>

  constructor(storage: ObservableStorage) {
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
