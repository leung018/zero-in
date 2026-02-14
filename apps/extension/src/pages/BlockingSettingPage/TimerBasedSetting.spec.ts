import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import {
  newTestTimerBasedBlockingRules,
  type TimerBasedBlockingRules
} from '@zero-in/shared/domain/timer-based-blocking/index'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { describe, expect, it } from 'vitest'
import config from '../../config'
import { BrowsingRules } from '../../domain/browsing-rules'
import { TimerInternalState } from '../../domain/timer/state/internal'
import { FakeActionService } from '../../infra/action'
import { assertSelectorCheckboxValue } from '../../test-utils/assert'
import { setUpListener } from '../../test-utils/listener'
import { dataTestSelector } from '../../test-utils/selector'
import TimerBasedSetting from './TimerBasedSetting.vue'

describe('TimerBasedSetting', () => {
  it('should render saved setting', async () => {
    const { wrapper: wrapper1 } = await mountTimerBasedSetting({
      timerBasedBlockingRules: {
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
      timerBasedBlockingRules: {
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
    const { wrapper, timerBasedBlockingRulesStorageService } = await mountTimerBasedSetting({
      timerBasedBlockingRules: {
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: true
      }
    })

    const expectedRules: TimerBasedBlockingRules = {
      pauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerNotRunning: false
    }
    await saveTimerBasedBlockingRules(wrapper, expectedRules)

    expect(await timerBasedBlockingRulesStorageService.get()).toEqual(expectedRules)
  })

  it('should trigger notifierService when clicking save', async () => {
    const { wrapper, updateSuccessNotifierService } = await mountTimerBasedSetting()

    expect(updateSuccessNotifierService.hasTriggered()).toBe(false)

    await saveTimerBasedBlockingRules(wrapper)

    expect(updateSuccessNotifierService.hasTriggered()).toBe(true)
  })

  it('should toggle browsing control after clicking save', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })

    const { wrapper, browsingControlService, listener } = await mountTimerBasedSetting({
      timerBasedBlockingRules: newTestTimerBasedBlockingRules({
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

    await saveTimerBasedBlockingRules(
      wrapper,
      newTestTimerBasedBlockingRules({
        pauseBlockingDuringBreaks: true
      })
    )

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()
  })
})

async function mountTimerBasedSetting({
  timerBasedBlockingRules = config.getDefaultTimerBasedBlockingRules(),
  browsingRules = new BrowsingRules(),
  weeklySchedules = [],
  timerState = TimerInternalState.newTestInstance()
} = {}) {
  const updateSuccessNotifierService = new FakeActionService()

  const {
    browsingControlService,
    communicationManager,
    listener,
    timerBasedBlockingRulesStorageService,
    browsingRulesStorageService,
    weeklySchedulesStorageService,
    timerStateStorageService
  } = await setUpListener()

  await timerBasedBlockingRulesStorageService.save(timerBasedBlockingRules)
  await browsingRulesStorageService.save(browsingRules)
  await weeklySchedulesStorageService.save(weeklySchedules)
  await timerStateStorageService.save(timerState)

  await listener.start()

  const wrapper = mount(TimerBasedSetting, {
    props: {
      timerBasedBlockingRulesStorageService,
      updateSuccessNotifierService,
      port: communicationManager.clientConnect()
    }
  })
  await flushPromises()
  return {
    browsingControlService,
    listener,
    wrapper,
    timerBasedBlockingRulesStorageService,
    updateSuccessNotifierService
  }
}

async function saveTimerBasedBlockingRules(
  wrapper: VueWrapper,
  timerBasedBlockingRules: TimerBasedBlockingRules = {
    pauseBlockingDuringBreaks: false,
    pauseBlockingWhenTimerNotRunning: false
  }
) {
  await wrapper
    .find(dataTestSelector('pause-blocking-during-breaks'))
    .setValue(timerBasedBlockingRules.pauseBlockingDuringBreaks)

  await wrapper
    .find(dataTestSelector('pause-blocking-when-timer-not-running'))
    .setValue(timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning)

  const saveButton = wrapper.find(dataTestSelector('save-timer-integration-button'))
  await saveButton.trigger('click')

  await flushPromises()
}
