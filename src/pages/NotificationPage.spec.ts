import { describe, expect, it } from 'vitest'
import {
  newTestNotificationSetting,
  type NotificationSetting
} from '../domain/notification_setting'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import NotificationPage from './NotificationPage.vue'
import { assertCheckboxValue } from '../test_utils/assert'
import { dataTestSelector } from '../test_utils/selector'
import { FakeActionService } from '../infra/action'
import { setUpListener } from '../test_utils/listener'
import { TimerConfig } from '../domain/pomodoro/config'
import { WorkRequestName } from '../service_workers/request'
import { Duration } from '../domain/pomodoro/duration'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'

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

    await saveNotificationSetting(wrapper, {
      reminderTab: true,
      desktopNotification: true,
      sound: true
    })

    const expected: NotificationSetting = {
      reminderTab: true,
      desktopNotification: true,
      sound: true
    }
    expect(await notificationSettingStorageService.get()).toEqual(expected)
  })

  it('should update the notification behavior after clicking save', async () => {
    const {
      wrapper,
      clientPort,
      scheduler,
      desktopNotificationService,
      soundService,
      reminderTabService
    } = await mountPage({
      notificationSetting: {
        reminderTab: true,
        desktopNotification: false,
        sound: true
      },
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 1 })
      })
    })

    await saveNotificationSetting(wrapper, {
      reminderTab: false,
      desktopNotification: true,
      sound: false
    })

    // Start the timer and finish the focus session. Notification should be triggered when finish focus session
    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)

    expect(reminderTabService.getTriggerCount()).toBe(0)
    expect(desktopNotificationService.getTriggerCount()).toBe(1)
    expect(soundService.getTriggerCount()).toBe(0)
  })

  it('should trigger reload after save', async () => {
    const { wrapper, reloadService } = await mountPage()

    expect(reloadService.getTriggerCount()).toBe(0)

    await saveNotificationSetting(wrapper)

    expect(reloadService.getTriggerCount()).toBe(1)
  })
})

async function mountPage({
  notificationSetting = newTestNotificationSetting(),
  timerConfig = TimerConfig.newTestInstance()
} = {}) {
  const reloadService = new FakeActionService()

  const {
    scheduler,
    communicationManager,
    desktopNotificationService,
    soundService,
    reminderTabService,
    notificationSettingStorageService,
    listener
  } = await setUpListener({
    timerConfig
  })

  await notificationSettingStorageService.save(notificationSetting)

  await listener.start()

  const clientPort = communicationManager.clientConnect()

  const wrapper = mount(NotificationPage, {
    props: {
      notificationSettingStorageService,
      reloadService,
      port: clientPort
    }
  })
  await flushPromises()
  return {
    wrapper,
    notificationSettingStorageService,
    reloadService,
    clientPort,
    scheduler,
    desktopNotificationService,
    soundService,
    reminderTabService
  }
}

async function saveNotificationSetting(
  wrapper: VueWrapper,
  notificationSetting = newTestNotificationSetting()
) {
  const reminderTabOption = wrapper.find(dataTestSelector('reminder-tab-option'))
  const desktopNotificationOption = wrapper.find(dataTestSelector('desktop-notification-option'))
  const soundOption = wrapper.find(dataTestSelector('sound-option'))

  await Promise.all([
    reminderTabOption.setValue(notificationSetting.reminderTab),
    desktopNotificationOption.setValue(notificationSetting.desktopNotification),
    soundOption.setValue(notificationSetting.sound)
  ])

  wrapper.find(dataTestSelector('save-button')).trigger('click')
  await flushPromises()
}
