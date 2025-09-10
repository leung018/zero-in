import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { newTestBlockingTimerIntegration } from '../domain/blocking_timer_integration'
import { newEmptyImportRecord } from '../domain/import_record/record'
import { setUpListener } from '../test_utils/listener'
import { dataTestSelector } from '../test_utils/selector'
import LoginProcessHelper from './LoginProcessHelper.vue'

describe('LoginProcessHelper', () => {
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

  const wrapper = mount(LoginProcessHelper, {
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
  expect(wrapper.find(dataTestSelector('sign-in-initial-message')).exists()).toBe(false)
  expect(wrapper.find(dataTestSelector('import-prompt')).exists()).toBe(true)
}

function assertInitialSignInMessageIsRendered(wrapper: VueWrapper) {
  expect(wrapper.find(dataTestSelector('sign-in-initial-message')).exists()).toBe(true)
  expect(wrapper.find(dataTestSelector('import-prompt')).exists()).toBe(false)
}
