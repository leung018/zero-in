import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { Duration } from '@zero-in/shared/domain/timer/duration'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  newTestNotificationSetting,
  type NotificationSetting
} from '../domain/notification-setting'
import { TimerConfig } from '../domain/timer/config'
import { FakeActionService } from '../infra/action'
import { WorkRequestName } from '../service-workers/request'
import { assertSelectorCheckboxValue } from '../test-utils/assert'
import { setUpListener } from '../test-utils/listener'
import { dataTestSelector } from '../test-utils/selector'
import NotificationPage from './NotificationPage.vue'

describe('NotificationPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the saved notification setting', async () => {
    let { wrapper } = await mountPage({
      notificationSetting: {
        reminderTab: true,
        desktopNotification: false,
        sound: true
      }
    })

    assertSelectorCheckboxValue(wrapper, dataTestSelector('reminder-tab-option'), true)
    assertSelectorCheckboxValue(wrapper, dataTestSelector('desktop-notification-option'), false)
    assertSelectorCheckboxValue(wrapper, dataTestSelector('sound-option'), true)

    wrapper = (
      await mountPage({
        notificationSetting: {
          reminderTab: false,
          desktopNotification: true,
          sound: false
        }
      })
    ).wrapper

    assertSelectorCheckboxValue(wrapper, dataTestSelector('reminder-tab-option'), false)
    assertSelectorCheckboxValue(wrapper, dataTestSelector('desktop-notification-option'), true)
    assertSelectorCheckboxValue(wrapper, dataTestSelector('sound-option'), false)
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
    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)
    await flushPromises()

    expect(reminderTabService.hasTriggered()).toBe(false)
    expect(desktopNotificationService.isNotificationActive()).toBe(true)
    expect(soundService.hasTriggered()).toBe(false)
  })

  it('should trigger updateSuccessNotifierService after save', async () => {
    const { wrapper, updateSuccessNotifierService } = await mountPage()

    expect(updateSuccessNotifierService.hasTriggered()).toBe(false)

    await saveNotificationSetting(wrapper)

    expect(updateSuccessNotifierService.hasTriggered()).toBe(true)
  })
})

async function mountPage({
  notificationSetting = newTestNotificationSetting(),
  timerConfig = TimerConfig.newTestInstance()
} = {}) {
  const updateSuccessNotifierService = new FakeActionService()

  const {
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
      updateSuccessNotifierService,
      port: clientPort
    }
  })
  await flushPromises()
  return {
    wrapper,
    notificationSettingStorageService,
    updateSuccessNotifierService,
    clientPort,

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

  wrapper.find(dataTestSelector('notification-save-button')).trigger('click')
  await flushPromises()
}
