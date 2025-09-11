import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { ImportStatus, newEmptyImportRecord } from '../domain/import/record/index'
import { SettingsExistenceService } from '../domain/import/settings_existence'
import { newTestNotificationSetting } from '../domain/notification_setting'
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

  it('should not render import prompt if user skipped import and remote has data', async () => {
    const { wrapper, triggerHelperProcess, remoteNotificationSettingStorageService } =
      await mountPage({
        importRecord: {
          status: ImportStatus.USER_SKIPPED
        }
      })
    await remoteNotificationSettingStorageService.save(newTestNotificationSetting())

    await triggerHelperProcess()

    assertInitialSignInMessageIsRendered(wrapper)
  })
})

async function mountPage({ importRecord = newEmptyImportRecord() } = {}) {
  const {
    communicationManager,
    notificationSettingStorageService: remoteNotificationSettingStorageService
  } = await setUpListener()

  const localStorage = LocalStorageWrapper.createFake()
  const localNotificationSettingStorageService = new NotificationSettingStorageService(localStorage)

  const clientPort = communicationManager.clientConnect()

  const wrapper = mount(SignInProcessHelper, {
    props: {
      port: clientPort,
      localSettingsExistenceService: SettingsExistenceService.createFake({ storage: localStorage }),
      importRecord
    }
  })
  await flushPromises()
  return {
    wrapper,
    clientPort,
    localNotificationSettingStorageService,
    remoteNotificationSettingStorageService,
    triggerHelperProcess: async () => {
      wrapper.vm.triggerHelperProcess()
      await flushPromises()
    }
  }
}

function assertImportPromptIsRendered(wrapper: VueWrapper) {
  assertRendered(wrapper, { initialSignInMessage: false, importPrompt: true })
}

function assertInitialSignInMessageIsRendered(wrapper: VueWrapper) {
  assertRendered(wrapper, { initialSignInMessage: true, importPrompt: false })
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
