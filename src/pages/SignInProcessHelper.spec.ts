import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { newTestBlockingTimerIntegration } from '../domain/blocking_timer_integration'
import { newEmptyImportRecord } from '../domain/import_record/record'
import { setUpListener } from '../test_utils/listener'
import { dataTestSelector } from '../test_utils/selector'
import SignInProcessHelper from './SignInProcessHelper.vue'

describe('SignInProcessHelper', () => {
  it('should render initial sign in message if helper process is not triggered', async () => {
    const { wrapper } = await mountPage()
    assertInitialSignInMessageIsRendered(wrapper)
  })

  it('should render import prompt if importRecord is empty and local has data', async () => {
    const { wrapper, blockingTimerIntegrationStorageService, triggerHelperProcess } =
      await mountPage({
        importRecord: newEmptyImportRecord()
      })
    await blockingTimerIntegrationStorageService.save(newTestBlockingTimerIntegration())

    await triggerHelperProcess()

    assertImportPromptIsRendered(wrapper)
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mountPage({ importRecord = newEmptyImportRecord() } = {}) {
  const { communicationManager, blockingTimerIntegrationStorageService } = await setUpListener()

  const clientPort = communicationManager.clientConnect()

  const wrapper = mount(SignInProcessHelper, {
    props: {
      port: clientPort
    }
  })
  await flushPromises()
  return {
    wrapper,
    clientPort,
    blockingTimerIntegrationStorageService,
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
