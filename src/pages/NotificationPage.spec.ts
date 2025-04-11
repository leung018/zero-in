import { describe, it } from 'vitest'
import { newTestNotificationSetting } from '../domain/notification_setting'
import { flushPromises, mount } from '@vue/test-utils'
import NotificationPage from './NotificationPage.vue'
import { assertCheckboxValue } from '../test_utils/assert'
import { dataTestSelector } from '../test_utils/selector'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'

describe('NotificationPage', () => {
  it('should render the saved notification setting', async () => {
    const { wrapper } = await mountPage({
      notificationSetting: {
        reminderTab: true,
        desktopNotification: false,
        sound: true
      }
    })

    assertCheckboxValue(wrapper, dataTestSelector('reminder-tab-option'), true)
    assertCheckboxValue(wrapper, dataTestSelector('desktop-notification-option'), false)
    assertCheckboxValue(wrapper, dataTestSelector('sound-option'), true)
  })
})

async function mountPage({ notificationSetting = newTestNotificationSetting() }) {
  const notificationSettingStorageService = NotificationSettingStorageService.createFake()
  await notificationSettingStorageService.set(notificationSetting)
  const wrapper = mount(NotificationPage, {
    props: {
      notificationSettingStorageService
    }
  })
  await flushPromises()
  return { wrapper }
}
