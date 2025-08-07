import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import config from '../../config'
import {
  newTestBlockingTimerIntegration,
  type BlockingTimerIntegration
} from '../../domain/blocking_timer_integration'
import { BrowsingRules } from '../../domain/browsing_rules'
import { TimerStage } from '../../domain/timer/stage'
import { newTestTimerExternalState } from '../../domain/timer/state/external'
import { TimerInternalState } from '../../domain/timer/state/internal'
import { FakeActionService } from '../../infra/action'
import { assertSelectorCheckboxValue } from '../../test_utils/assert'
import { setUpListener } from '../../test_utils/listener'
import { dataTestSelector } from '../../test_utils/selector'
import TimerIntegrationSetting from './TimerIntegrationSetting.vue'

describe('TimerIntegrationSetting', () => {
  it('should render saved setting', async () => {
    const { wrapper: wrapper1 } = await mountTimerIntegrationSetting({
      blockingTimerIntegration: {
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: true
      }
    })
    assertSelectorCheckboxValue(wrapper1, dataTestSelector('pause-blocking-during-breaks'), false)
    assertSelectorCheckboxValue(
      wrapper1,
      dataTestSelector('pause-blocking-when-timer-not-running'),
      true
    )

    const { wrapper: wrapper2 } = await mountTimerIntegrationSetting({
      blockingTimerIntegration: {
        pauseBlockingDuringBreaks: true,
        pauseBlockingWhenTimerNotRunning: false
      }
    })
    assertSelectorCheckboxValue(wrapper2, dataTestSelector('pause-blocking-during-breaks'), true)
    assertSelectorCheckboxValue(
      wrapper2,
      dataTestSelector('pause-blocking-when-timer-not-running'),
      false
    )
  })

  it('should persist setting after clicking save', async () => {
    const { wrapper, blockingTimerIntegrationStorageService } = await mountTimerIntegrationSetting({
      blockingTimerIntegration: {
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: true
      }
    })

    const expectedIntegration: BlockingTimerIntegration = {
      pauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerNotRunning: false
    }
    await saveBlockingTimerIntegration(wrapper, expectedIntegration)

    expect(await blockingTimerIntegrationStorageService.get()).toEqual(expectedIntegration)
  })

  it('should trigger notifierService when clicking save', async () => {
    const { wrapper, updateSuccessNotifierService } = await mountTimerIntegrationSetting()

    expect(updateSuccessNotifierService.hasTriggered()).toBe(false)

    await saveBlockingTimerIntegration(wrapper)

    expect(updateSuccessNotifierService.hasTriggered()).toBe(true)
  })

  it('should toggle browsing control after clicking save', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })

    const { wrapper, browsingControlService, listener } = await mountTimerIntegrationSetting({
      blockingTimerIntegration: newTestBlockingTimerIntegration({
        pauseBlockingDuringBreaks: false
      }),
      timerState: newTestTimerExternalState({
        stage: TimerStage.SHORT_BREAK,
        isRunning: true
      }),
      browsingRules,
      weeklySchedules: []
    })

    listener.toggleBrowsingRules()
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    await saveBlockingTimerIntegration(
      wrapper,
      newTestBlockingTimerIntegration({
        pauseBlockingDuringBreaks: true
      })
    )

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()
  })
})

async function mountTimerIntegrationSetting({
  blockingTimerIntegration = config.getDefaultBlockingTimerIntegration(),
  browsingRules = new BrowsingRules(),
  weeklySchedules = [],
  timerState = newTestTimerExternalState()
} = {}) {
  const updateSuccessNotifierService = new FakeActionService()

  const {
    browsingControlService,
    communicationManager,
    listener,
    blockingTimerIntegrationStorageService,
    browsingRulesStorageService,
    weeklyScheduleStorageService,
    timerStateStorageService
  } = await setUpListener()

  await blockingTimerIntegrationStorageService.save(blockingTimerIntegration)
  await browsingRulesStorageService.save(browsingRules)
  await weeklyScheduleStorageService.saveAll(weeklySchedules)
  await timerStateStorageService.save(TimerInternalState.fromExternalState(timerState))

  await listener.start()

  const wrapper = mount(TimerIntegrationSetting, {
    props: {
      blockingTimerIntegrationStorageService,
      updateSuccessNotifierService,
      port: communicationManager.clientConnect()
    }
  })
  await flushPromises()
  return {
    browsingControlService,
    listener,
    wrapper,
    blockingTimerIntegrationStorageService,
    updateSuccessNotifierService
  }
}

async function saveBlockingTimerIntegration(
  wrapper: VueWrapper,
  blockingTimerIntegration: BlockingTimerIntegration = {
    pauseBlockingDuringBreaks: false,
    pauseBlockingWhenTimerNotRunning: false
  }
) {
  await wrapper
    .find(dataTestSelector('pause-blocking-during-breaks'))
    .setValue(blockingTimerIntegration.pauseBlockingDuringBreaks)

  await wrapper
    .find(dataTestSelector('pause-blocking-when-timer-not-running'))
    .setValue(blockingTimerIntegration.pauseBlockingWhenTimerNotRunning)

  const saveButton = wrapper.find(dataTestSelector('save-timer-integration-button'))
  await saveButton.trigger('click')

  await flushPromises()
}
