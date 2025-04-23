import { describe, expect, it } from 'vitest'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import TimerIntegrationSetting from './TimerIntegrationSetting.vue'
import config from '../../config'
import { BlockingTimerIntegrationStorageService } from '../../domain/blocking_timer_integration/storage'
import { assertCheckboxValue } from '../../test_utils/assert'
import { dataTestSelector } from '../../test_utils/selector'
import { FakeActionService } from '../../infra/action'
import { setUpListener } from '../../test_utils/listener'
import { BrowsingRules } from '../../domain/browsing_rules'
import { BrowsingRulesStorageService } from '../../domain/browsing_rules/storage'
import { WeeklyScheduleStorageService } from '../../domain/schedules/storage'
import { newTestTimerState } from '../../domain/pomodoro/state'
import { PomodoroStage } from '../../domain/pomodoro/stage'
import { TimerStateStorageService } from '../../domain/pomodoro/state/storage'
import type { BlockingTimerIntegration } from '../../domain/blocking_timer_integration'

describe('TimerIntegrationSetting', () => {
  it('should render saved setting', async () => {
    const { wrapper } = await mountTimerIntegrationSetting({
      blockingTimerIntegration: {
        shouldPauseBlockingDuringBreaks: false
      }
    })
    assertCheckboxValue(wrapper, dataTestSelector('pause-blocking-during-breaks'), false)
  })

  it('should persist setting after clicking save', async () => {
    const { wrapper, blockingTimerIntegrationStorageService } = await mountTimerIntegrationSetting({
      blockingTimerIntegration: {
        shouldPauseBlockingDuringBreaks: false
      }
    })

    await saveBlockingTimerIntegration(wrapper, {
      shouldPauseBlockingDuringBreaks: true
    })

    expect(
      (await blockingTimerIntegrationStorageService.get()).shouldPauseBlockingDuringBreaks
    ).toBe(true)
  })

  it('should trigger reload when clicking save', async () => {
    const { wrapper, reloadService } = await mountTimerIntegrationSetting()

    expect(reloadService.getTriggerCount()).toBe(0)

    await saveBlockingTimerIntegration(wrapper)

    expect(reloadService.getTriggerCount()).toBe(1)
  })

  it('should toggle browsing control after clicking save', async () => {
    const browsingRules = new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })

    const { wrapper, browsingControlService, listener } = await mountTimerIntegrationSetting({
      blockingTimerIntegration: {
        shouldPauseBlockingDuringBreaks: false
      },
      timerState: newTestTimerState({
        stage: PomodoroStage.SHORT_BREAK
      }),
      browsingRules,
      weeklySchedules: []
    })

    listener.toggleBrowsingRules()
    await flushPromises()

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(browsingRules)

    await saveBlockingTimerIntegration(wrapper, {
      shouldPauseBlockingDuringBreaks: true
    })

    expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()
  })
})

async function mountTimerIntegrationSetting({
  blockingTimerIntegration = config.getDefaultBlockingTimerIntegration(),
  browsingRules = new BrowsingRules(),
  weeklySchedules = [],
  timerState = newTestTimerState()
} = {}) {
  const reloadService = new FakeActionService()

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
  await timerStateStorageService.save(timerState)

  await listener.start()

  const wrapper = mount(TimerIntegrationSetting, {
    props: {
      blockingTimerIntegrationStorageService,
      reloadService,
      port: communicationManager.clientConnect()
    }
  })
  await flushPromises()
  return {
    browsingControlService,
    listener,
    wrapper,
    blockingTimerIntegrationStorageService,
    reloadService
  }
}

async function saveBlockingTimerIntegration(
  wrapper: VueWrapper,
  blockingTimerIntegration: BlockingTimerIntegration = {
    shouldPauseBlockingDuringBreaks: false
  }
) {
  const checkbox = wrapper.find(dataTestSelector('pause-blocking-during-breaks'))
  await checkbox.setValue(blockingTimerIntegration.shouldPauseBlockingDuringBreaks)
  const saveButton = wrapper.find(dataTestSelector('save-timer-integration-button'))
  await saveButton.trigger('click')
  await flushPromises()
}
