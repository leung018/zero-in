import { describe, expect, it } from 'vitest'
import {
  newTestNotificationSetting,
  type NotificationSetting
} from '../domain/notification_setting'
import { flushPromises, mount } from '@vue/test-utils'
import NotificationPage from './NotificationPage.vue'
import { assertCheckboxValue } from '../test_utils/assert'
import { dataTestSelector } from '../test_utils/selector'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { FakeActionService } from '../infra/action'

describe('NotificationPage', () => {
  it('should render the saved notification setting', async () => {
    let { wrapper } = await mountPage({
      notificationSetting: {
        reminderTab: true,
        desktopNotification: false,
        sound: true
      }
    })

    assertCheckboxValue(wrapper, dataTestSelector('reminder-tab-option'), true)
    assertCheckboxValue(wrapper, dataTestSelector('desktop-notification-option'), false)
    assertCheckboxValue(wrapper, dataTestSelector('sound-option'), true)

    wrapper = (
      await mountPage({
        notificationSetting: {
          reminderTab: false,
          desktopNotification: true,
          sound: false
        }
      })
    ).wrapper

    assertCheckboxValue(wrapper, dataTestSelector('reminder-tab-option'), false)
    assertCheckboxValue(wrapper, dataTestSelector('desktop-notification-option'), true)
    assertCheckboxValue(wrapper, dataTestSelector('sound-option'), false)
  })

  it('should update the notification setting when the user changes the options', async () => {
    const { wrapper, notificationSettingStorageService } = await mountPage({
      notificationSetting: {
        reminderTab: false,
        desktopNotification: false,
        sound: false
      }
    })

    const reminderTabOption = wrapper.find(dataTestSelector('reminder-tab-option'))
    const desktopNotificationOption = wrapper.find(dataTestSelector('desktop-notification-option'))
    const soundOption = wrapper.find(dataTestSelector('sound-option'))

    await Promise.all([
      reminderTabOption.setValue(true),
      desktopNotificationOption.setValue(true),
      soundOption.setValue(true)
    ])

    wrapper.find(dataTestSelector('save-button')).trigger('click')
    await flushPromises()

    const expected: NotificationSetting = {
      reminderTab: true,
      desktopNotification: true,
      sound: true
    }
    expect(await notificationSettingStorageService.get()).toEqual(expected)
  })

  it('should trigger reload when click save', async () => {
    const { wrapper, reloadService } = await mountPage()

    expect(reloadService.getTriggerCount()).toBe(0)

    wrapper.find(dataTestSelector('save-button')).trigger('click')
    await flushPromises()

    expect(reloadService.getTriggerCount()).toBe(1)
  })
})

async function mountPage({ notificationSetting = newTestNotificationSetting() } = {}) {
  const notificationSettingStorageService = NotificationSettingStorageService.createFake()
  await notificationSettingStorageService.save(notificationSetting)

  const reloadService = new FakeActionService()

  const wrapper = mount(NotificationPage, {
    props: {
      notificationSettingStorageService,
      reloadService
    }
  })
  await flushPromises()
  return { wrapper, notificationSettingStorageService, reloadService }
}
