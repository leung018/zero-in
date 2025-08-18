import { expect, it } from 'vitest'
import { NotificationSetting } from '.'
import config from '../../config'
import { ObservableStorage } from '../../infra/storage/interface'
import { NotificationSettingStorageService } from './storage'

export function runNotificationSettingStorageServiceTests(storage: ObservableStorage) {
  it('should get the default notification setting', async () => {
    const service = new NotificationSettingStorageService(storage)
    expect(await service.get()).toStrictEqual(config.getDefaultNotificationSetting())
  })

  it('should set and get the notification setting', async () => {
    const service = new NotificationSettingStorageService(storage)
    const notificationSetting: NotificationSetting = {
      reminderTab: false,
      desktopNotification: false,
      sound: true
    }
    await service.save(notificationSetting)
    expect(await service.get()).toStrictEqual(notificationSetting)
  })
}
