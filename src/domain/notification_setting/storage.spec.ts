import { describe, expect, it } from 'vitest'
import { NotificationSettingStorageService } from './storage'
import config from '../../config'
import type { NotificationSetting } from '.'

describe('NotificationSettingStorageService', () => {
  it('should get the default notification setting', async () => {
    const service = NotificationSettingStorageService.createFake()
    expect(await service.get()).toEqual(config.getDefaultNotificationSetting())
  })

  it('should set and get the notification setting', async () => {
    const service = NotificationSettingStorageService.createFake()
    const notificationSetting: NotificationSetting = {
      reminderTab: false,
      desktopNotification: false,
      sound: true
    }
    await service.save(notificationSetting)
    expect(await service.get()).toEqual(notificationSetting)
  })
})
