import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import config from '../../config'
import { BrowsingRules } from '../../domain/browsing_rules'
import { TimerStage } from '../../domain/timer/stage'
import { TimerInternalState } from '../../domain/timer/state/internal'
import {
  newTestTimerBasedBlocking,
  type TimerBasedBlocking
} from '../../domain/timer_based_blocking'
import { FakeActionService } from '../../infra/action'
import { assertSelectorCheckboxValue } from '../../test_utils/assert'
import { setUpListener } from '../../test_utils/listener'
import { dataTestSelector } from '../../test_utils/selector'
import TimerBasedSetting from './TimerBasedSetting.vue'

describe('TimerBasedSetting', () => {
  it('should render saved setting', async () => {
    const { wrapper: wrapper1 } = await mountTimerBasedSetting({
      timerBasedBlocking: {
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

    const { wrapper: wrapper2 } = await mountTimerBasedSetting({
      timerBasedBlocking: {
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
    const { wrapper, timerBasedBlockingStorageService } = await mountTimerBasedSetting({
      timerBasedBlocking: {
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: true
      }
    })

    const expectedIntegration: TimerBasedBlocking = {
      pauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerNotRunning: false
    }
    await saveTimerBasedBlocking(wrapper, expectedIntegration)

    expect(await timerBasedBlockingStorageService.get()).toEqual(expectedIntegration)
  })

  it('should trigger notifierService when clicking save', async () => {
    const { wrapper, updateSuccessNotifierService } = await mountTimerBasedSetting()

    expect(updateSuccessNotifierService.hasTriggered()).toBe(false)

    await saveTimerBasedBlocking(wrapper)

    expect(updateSuccessNotifierService.hasTriggered()).toBe(true)
  })

  it('should toggle browsing control after clicking save', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })

    const { wrapper, browsingControlService, listener } = await mountTimerBasedSetting({
      timerBasedBlocking: newTestTimerBasedBlocking({
        pauseBlockingDuringBreaks: false
      }),
      timerState: TimerInternalState.newTestInstance({
        stage: TimerStage.SHORT_BREAK,
        pausedAt: null
      }),
      browsingRules,
      weeklySchedules: []
    })

    listener.toggleBrowsingRules()
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    await saveTimerBasedBlocking(
      wrapper,
      newTestTimerBasedBlocking({
        pauseBlockingDuringBreaks: true
      })
    )

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()
  })
})

async function mountTimerBasedSetting({
  timerBasedBlocking = config.getDefaultTimerBasedBlocking(),
  browsingRules = new BrowsingRules(),
  weeklySchedules = [],
  timerState = TimerInternalState.newTestInstance()
} = {}) {
  const updateSuccessNotifierService = new FakeActionService()

  const {
    browsingControlService,
    communicationManager,
    listener,
    timerBasedBlockingStorageService,
    browsingRulesStorageService,
    weeklySchedulesStorageService,
    timerStateStorageService
  } = await setUpListener()

  await timerBasedBlockingStorageService.save(timerBasedBlocking)
  await browsingRulesStorageService.save(browsingRules)
  await weeklySchedulesStorageService.save(weeklySchedules)
  await timerStateStorageService.save(timerState)

  await listener.start()

  const wrapper = mount(TimerBasedSetting, {
    props: {
      timerBasedBlockingStorageService,
      updateSuccessNotifierService,
      port: communicationManager.clientConnect()
    }
  })
  await flushPromises()
  return {
    browsingControlService,
    listener,
    wrapper,
    timerBasedBlockingStorageService,
    updateSuccessNotifierService
  }
}

async function saveTimerBasedBlocking(
  wrapper: VueWrapper,
  timerBasedBlocking: TimerBasedBlocking = {
    pauseBlockingDuringBreaks: false,
    pauseBlockingWhenTimerNotRunning: false
  }
) {
  await wrapper
    .find(dataTestSelector('pause-blocking-during-breaks'))
    .setValue(timerBasedBlocking.pauseBlockingDuringBreaks)

  await wrapper
    .find(dataTestSelector('pause-blocking-when-timer-not-running'))
    .setValue(timerBasedBlocking.pauseBlockingWhenTimerNotRunning)

  const saveButton = wrapper.find(dataTestSelector('save-timer-integration-button'))
  await saveButton.trigger('click')

  await flushPromises()
}
