import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImportStatus, newEmptyImportRecord } from '../domain/import/record/index'
import { ImportRecordStorageService } from '../domain/import/record/storage'
import { newTestNotificationSetting, NotificationSetting } from '../domain/notification_setting'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { TimerConfig } from '../domain/timer/config'
import { Duration } from '../domain/timer/duration'
import { LocalStorageWrapper } from '../infra/storage/local_storage'
import { ClientPort } from '../service_workers/listener'
import { WorkRequestName } from '../service_workers/request'
import { setUpListener } from '../test_utils/listener'
import { dataTestSelector } from '../test_utils/selector'
import SignInProcessHelper from './SignInProcessHelper.vue'

describe('SignInProcessHelper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render initial sign in message if helper process is not triggered', async () => {
    const { wrapper } = await mountPage()
    assertInitialSignInMessageIsRendered(wrapper)
  })

  it('should render import prompt if importRecord is empty and local has data', async () => {
    const { wrapper, localNotificationSettingStorageService, triggerHelperProcess } =
      await mountPage({
        importRecord: newEmptyImportRecord()
      })
    await localNotificationSettingStorageService.save(newTestNotificationSetting())

    await triggerHelperProcess()

    assertImportPromptIsRendered(wrapper)

    // When import prompt is rendered, onHelperProcessComplete should not be emitted yet
    expect(wrapper.emitted('onHelperProcessComplete')).toBeFalsy()
  })

  it('should not render import prompt if local has no data', async () => {
    const { wrapper, triggerHelperProcess } = await mountPage({
      importRecord: newEmptyImportRecord()
    })

    await triggerHelperProcess()

    assertInitialSignInMessageIsRendered(wrapper)

    // When import prompt is not rendered, onHelperProcessComplete should be emitted
    expect(wrapper.emitted('onHelperProcessComplete')).toBeTruthy()
  })

  it('should not render import prompt if user skipped import and remote has data, even local has data', async () => {
    const {
      wrapper,
      triggerHelperProcess,
      remoteNotificationSettingStorageService,
      localNotificationSettingStorageService
    } = await mountPage({
      importRecord: {
        status: ImportStatus.USER_SKIPPED
      }
    })
    await remoteNotificationSettingStorageService.save(newTestNotificationSetting())
    await localNotificationSettingStorageService.save(newTestNotificationSetting())

    await triggerHelperProcess()

    assertInitialSignInMessageIsRendered(wrapper)
  })

  it('should not render import prompt if user imported, even local has data', async () => {
    const { wrapper, triggerHelperProcess, localNotificationSettingStorageService } =
      await mountPage({
        importRecord: {
          status: ImportStatus.IMPORTED
        }
      })

    await localNotificationSettingStorageService.save(newTestNotificationSetting())

    await triggerHelperProcess()

    assertInitialSignInMessageIsRendered(wrapper)
  })

  it('should render import prompt if import record is empty and both remote, local has data', async () => {
    const {
      wrapper,
      triggerHelperProcess,
      remoteNotificationSettingStorageService,
      localNotificationSettingStorageService
    } = await mountPage({
      importRecord: newEmptyImportRecord()
    })

    await remoteNotificationSettingStorageService.save(newTestNotificationSetting())
    await localNotificationSettingStorageService.save(newTestNotificationSetting())

    await triggerHelperProcess()

    assertImportPromptIsRendered(wrapper)
  })

  it('should render import prompt if user skipped import and remote has no data and local has data', async () => {
    const { wrapper, triggerHelperProcess, localNotificationSettingStorageService } =
      await mountPage({
        importRecord: {
          status: ImportStatus.USER_SKIPPED
        }
      })

    await localNotificationSettingStorageService.save(newTestNotificationSetting())

    await triggerHelperProcess()

    assertImportPromptIsRendered(wrapper)
  })

  it('should import data to remote if user clicked import on import prompt', async () => {
    const {
      wrapper,
      triggerHelperProcess,
      remoteNotificationSettingStorageService,
      localNotificationSettingStorageService,
      importRecordStorageService
    } = await mountPage({
      importRecord: newEmptyImportRecord()
    })

    await localNotificationSettingStorageService.save(nonDefaultAllDisabledSetting)
    await triggerHelperProcess()

    await wrapper.find(dataTestSelector('import-button')).trigger('click')
    await flushPromises()

    // Verify the data is imported
    await expect(remoteNotificationSettingStorageService.get()).resolves.toEqual(
      nonDefaultAllDisabledSetting
    )

    // Verify the import status is updated
    const record = await importRecordStorageService.get()
    expect(record.status).toBe(ImportStatus.IMPORTED)

    // Verify the onHelperProcessComplete event is emitted
    expect(wrapper.emitted('onHelperProcessComplete')).toBeTruthy()
  })

  it('should skip import if user clicked skip on import prompt', async () => {
    const {
      wrapper,
      triggerHelperProcess,
      remoteNotificationSettingStorageService,
      localNotificationSettingStorageService,
      importRecordStorageService
    } = await mountPage({
      importRecord: newEmptyImportRecord()
    })

    await localNotificationSettingStorageService.save(nonDefaultAllDisabledSetting)
    await triggerHelperProcess()

    await wrapper.find(dataTestSelector('skip-button')).trigger('click')
    await flushPromises()

    // Verify the import status is updated
    const record = await importRecordStorageService.get()
    expect(record.status).toBe(ImportStatus.USER_SKIPPED)

    // Verify the remote storage is not updated
    await expect(remoteNotificationSettingStorageService.get()).resolves.not.toEqual(
      nonDefaultAllDisabledSetting
    )

    // Verify the onHelperProcessComplete event is emitted
    expect(wrapper.emitted('onHelperProcessComplete')).toBeTruthy()
  })

  it('should trigger listener reload after import', async () => {
    const {
      clientPort,
      wrapper,
      reminderTabService,
      soundService,
      desktopNotificationService,
      localNotificationSettingStorageService,
      triggerHelperProcess
    } = await mountPage({
      importRecord: newEmptyImportRecord(),
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({
          seconds: 1
        })
      })
    })

    await localNotificationSettingStorageService.save(nonDefaultAllDisabledSetting)
    await triggerHelperProcess()

    await wrapper.find(dataTestSelector('import-button')).trigger('click')
    await flushPromises()

    await clientPort.send({ name: WorkRequestName.START_TIMER })
    vi.advanceTimersByTime(1000)

    expect(reminderTabService.hasTriggered()).toBe(false)
    expect(soundService.hasTriggered()).toBe(false)
    expect(desktopNotificationService.isNotificationActive()).toBe(false)
  })
})

async function mountPage({
  importRecord = newEmptyImportRecord(),
  timerConfig = TimerConfig.newTestInstance()
} = {}) {
  const {
    communicationManager,
    notificationSettingStorageService: remoteNotificationSettingStorageService,
    storage: remoteStorage,
    reminderTabService,
    soundService,
    desktopNotificationService,
    listener
  } = await setUpListener({ timerConfig })

  const localStorage = LocalStorageWrapper.createFake()
  const localNotificationSettingStorageService = new NotificationSettingStorageService(localStorage)

  const importRecordStorageService = ImportRecordStorageService.createFake()
  await importRecordStorageService.save(importRecord)

  await listener.start()

  const clientPort: ClientPort = communicationManager.clientConnect()

  const wrapper = mount(SignInProcessHelper, {
    props: {
      port: clientPort,
      localStorage,
      remoteStorage,
      importRecordStorageService
    }
  })
  await flushPromises()
  return {
    wrapper,
    clientPort,
    localNotificationSettingStorageService,
    remoteNotificationSettingStorageService,
    importRecordStorageService,
    triggerHelperProcess: async () => {
      wrapper.vm.triggerHelperProcess()
      await flushPromises()
    },
    reminderTabService,
    soundService,
    desktopNotificationService
  }
}

function assertImportPromptIsRendered(wrapper: VueWrapper) {
  assertRendered(wrapper, {
    initialSignInMessage: false,
    importPrompt: true
  })
}

function assertInitialSignInMessageIsRendered(wrapper: VueWrapper) {
  assertRendered(wrapper, {
    initialSignInMessage: true,
    importPrompt: false
  })
}

function assertRendered(
  wrapper: VueWrapper,
  componentsRendered: {
    initialSignInMessage: boolean
    importPrompt: boolean
  }
) {
  expect(wrapper.find(dataTestSelector('sign-in-initial-message')).exists()).toBe(
    componentsRendered.initialSignInMessage
  )
  expect(wrapper.find(dataTestSelector('import-prompt')).exists()).toBe(
    componentsRendered.importPrompt
  )
}

const nonDefaultAllDisabledSetting: Readonly<NotificationSetting> = newTestNotificationSetting({
  // All false must not be default notification setting.
  // So if import not success, setting in remote won't match below.
  desktopNotification: false,
  reminderTab: false,
  sound: false
})
