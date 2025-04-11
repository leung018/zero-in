import type { NotificationSetting } from '.'
import config from '../../config'
import { FakeStorage, type Storage } from '../../infra/storage'

const STORAGE_KEY = 'notificationSetting'

export class NotificationSettingStorageService {
  static create() {}

  static createFake() {
    return new NotificationSettingStorageService(new FakeStorage())
  }

  private constructor(private storage: Storage) {}

  async get(): Promise<NotificationSetting> {
    const result = await this.storage.get(STORAGE_KEY)
    return result[STORAGE_KEY] || config.getDefaultNotificationSetting()
  }

  async set(notificationSetting: NotificationSetting): Promise<void> {
    return this.storage.set({ [STORAGE_KEY]: notificationSetting })
  }
}
