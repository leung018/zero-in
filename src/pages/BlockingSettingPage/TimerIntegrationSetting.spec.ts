import { describe, it} from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import TimerIntegrationSetting from './TimerIntegrationSetting.vue'
import config from '../../config'
import { BlockingTimerIntegrationStorageService } from '../../domain/blocking_timer_integration/storage'
import { assertCheckboxValue } from '../../test_utils/assert'
import { dataTestSelector } from '../../test_utils/selector'

describe('TimerIntegrationSetting', () => {
  it('should render saved setting', async () => {
    const { wrapper } = await mountTimerIntegrationSetting({
      blockingTimerIntegration: {
        shouldPauseBlockingDuringBreaks: false
      }
    })
    assertCheckboxValue(wrapper, dataTestSelector('pause-blocking-during-breaks'), false)
  })
})

async function mountTimerIntegrationSetting({
  blockingTimerIntegration = config.getDefaultBlockingTimerIntegration()
} = {}) {
  const blockingTimerIntegrationStorageService = BlockingTimerIntegrationStorageService.createFake()
  await blockingTimerIntegrationStorageService.save(blockingTimerIntegration)
  const wrapper = mount(TimerIntegrationSetting, {
    props: {
      blockingTimerIntegrationStorageService
    }
  })
  await flushPromises()
  return {
    wrapper,
    blockingTimerIntegrationStorageService
  }
}
