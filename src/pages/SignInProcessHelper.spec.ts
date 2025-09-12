import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ImportStatus, newEmptyImportRecord } from '../domain/import/record/index'
import { ImportRecordStorageService } from '../domain/import/record/storage'
import { newTestNotificationSetting, NotificationSetting } from '../domain/notification_setting'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { LocalStorageWrapper } from '../infra/storage/local_storage'
import { setUpListener } from '../test_utils/listener'
import { dataTestSelector } from '../test_utils/selector'
import SignInProcessHelper from './SignInProcessHelper.vue'

describe('SignInProcessHelper', () => {
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
  })

  it('should not render import prompt if local has no data', async () => {
    const { wrapper, triggerHelperProcess } = await mountPage({
      importRecord: newEmptyImportRecord()
    })

    await triggerHelperProcess()

    assertInitialSignInMessageIsRendered(wrapper)
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

    await localNotificationSettingStorageService.save(nonDefaultNotificationSetting)
    await triggerHelperProcess()

    await wrapper.find(dataTestSelector('import-button')).trigger('click')
    await flushPromises()

    // Verify the data is imported
    await expect(remoteNotificationSettingStorageService.get()).resolves.toEqual(
      nonDefaultNotificationSetting
    )

    // Verify the import status is updated
    const record = await importRecordStorageService.get()
    expect(record.status).toBe(ImportStatus.IMPORTED)

    // Display the import success message
    assertImportSuccessMessageIsRendered(wrapper)

    // Verify the onHelperProcessComplete event is emitted
    await expect(wrapper.emitted('onHelperProcessComplete')).toBeTruthy()
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

    await localNotificationSettingStorageService.save(nonDefaultNotificationSetting)
    await triggerHelperProcess()

    await wrapper.find(dataTestSelector('skip-button')).trigger('click')
    await flushPromises()

    const record = await importRecordStorageService.get()
    expect(record.status).toBe(ImportStatus.USER_SKIPPED)

    await expect(remoteNotificationSettingStorageService.get()).resolves.not.toEqual(
      nonDefaultNotificationSetting
    )
  })
})

async function mountPage({ importRecord = newEmptyImportRecord() } = {}) {
  const {
    communicationManager,
    notificationSettingStorageService: remoteNotificationSettingStorageService,
    storage: remoteStorage
  } = await setUpListener()

  const localStorage = LocalStorageWrapper.createFake()
  const localNotificationSettingStorageService = new NotificationSettingStorageService(localStorage)

  const importRecordStorageService = ImportRecordStorageService.createFake()
  await importRecordStorageService.save(importRecord)

  const clientPort = communicationManager.clientConnect()

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
    }
  }
}

function assertImportPromptIsRendered(wrapper: VueWrapper) {
  assertRendered(wrapper, {
    initialSignInMessage: false,
    importPrompt: true,
    importSuccessMessage: false
  })
}

function assertInitialSignInMessageIsRendered(wrapper: VueWrapper) {
  assertRendered(wrapper, {
    initialSignInMessage: true,
    importPrompt: false,
    importSuccessMessage: false
  })
}

function assertImportSuccessMessageIsRendered(wrapper: VueWrapper) {
  assertRendered(wrapper, {
    initialSignInMessage: false,
    importPrompt: false,
    importSuccessMessage: true
  })
}

function assertRendered(
  wrapper: VueWrapper,
  componentsRendered: {
    initialSignInMessage: boolean
    importPrompt: boolean
    importSuccessMessage: boolean
  }
) {
  expect(wrapper.find(dataTestSelector('sign-in-initial-message')).exists()).toBe(
    componentsRendered.initialSignInMessage
  )
  expect(wrapper.find(dataTestSelector('import-prompt')).exists()).toBe(
    componentsRendered.importPrompt
  )
  expect(wrapper.find(dataTestSelector('import-success-message')).exists()).toBe(
    componentsRendered.importSuccessMessage
  )
}

const nonDefaultNotificationSetting: Readonly<NotificationSetting> = newTestNotificationSetting({
  // All false must not be default notification setting.
  // So if import not success, setting in remote won't match below.
  desktopNotification: false,
  reminderTab: false,
  sound: false
})
