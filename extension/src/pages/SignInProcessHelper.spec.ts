import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ImportStatus, newEmptyImportRecord } from '../domain/import/record/index'
import { newTestNotificationSetting, NotificationSetting } from '../domain/notification_setting'
import { NotificationSettingStorageService } from '../domain/notification_setting/storage'
import { fakeImportRecordStorageService } from '../infra/storage/factories/fake'
import { LocalStorageWrapper } from '../infra/storage/local_storage'
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

    await localNotificationSettingStorageService.save(nonDefaultNotificationSetting)
    await triggerHelperProcess()

    await wrapper.find(dataTestSelector('skip-button')).trigger('click')
    await flushPromises()

    // Verify the import status is updated
    const record = await importRecordStorageService.get()
    expect(record.status).toBe(ImportStatus.USER_SKIPPED)

    // Verify the remote storage is not updated
    await expect(remoteNotificationSettingStorageService.get()).resolves.not.toEqual(
      nonDefaultNotificationSetting
    )

    // Verify the onHelperProcessComplete event is emitted
    expect(wrapper.emitted('onHelperProcessComplete')).toBeTruthy()
  })
})

async function mountPage({ importRecord = newEmptyImportRecord() } = {}) {
  const remoteStorage = LocalStorageWrapper.createFake() // Simulate remote storage
  const remoteNotificationSettingStorageService = new NotificationSettingStorageService(
    remoteStorage
  )

  const localStorage = LocalStorageWrapper.createFake()
  const localNotificationSettingStorageService = new NotificationSettingStorageService(localStorage)

  const importRecordStorageService = fakeImportRecordStorageService()
  await importRecordStorageService.save(importRecord)

  const wrapper = mount(SignInProcessHelper, {
    props: {
      localStorage,
      remoteStorage,
      importRecordStorageService
    }
  })
  await flushPromises()
  return {
    wrapper,
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

const nonDefaultNotificationSetting: Readonly<NotificationSetting> = newTestNotificationSetting({
  // All false must not be default notification setting.
  // So if import not success, setting in remote won't match below.
  desktopNotification: false,
  reminderTab: false,
  sound: false
})
