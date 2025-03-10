import { flushPromises, mount } from '@vue/test-utils'
import ReminderPage from './ReminderPage.vue'
import { describe, expect, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { PomodoroStage } from '../domain/pomodoro/stage'
import { startBackgroundListener } from '../test_utils/listener'
import { FakeActionService } from '../infra/action'
import { newTestPomodoroTimerConfig } from '../domain/pomodoro/config'

describe('ReminderPage', () => {
  it('should display proper reminder', async () => {
    const { scheduler, timer, wrapper } = mountPage({
      timerConfig: {
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        numOfPomodoriPerCycle: 2
      }
    })

    timer.start()
    scheduler.advanceTime(3001)
    await flushPromises()

    expect(wrapper.find("[data-test='hint-message']").text()).toContain('Take a break')

    timer.start()
    scheduler.advanceTime(1001)
    await flushPromises()

    expect(wrapper.find("[data-test='hint-message']").text()).toContain('Start focusing')

    timer.start()
    scheduler.advanceTime(3001)
    await flushPromises()

    expect(wrapper.find("[data-test='hint-message']").text()).toContain('Take a longer break')
  })

  it('should click start button to start timer again', async () => {
    const { scheduler, timer, wrapper } = mountPage({
      timerConfig: newTestPomodoroTimerConfig({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 2 }),
        numOfPomodoriPerCycle: 4
      })
    })

    timer.start()
    scheduler.advanceTime(3001)
    await flushPromises()

    expect(timer.getState().isRunning).toBe(false)

    wrapper.find("[data-test='start-button']").trigger('click')
    scheduler.advanceTime(1000)
    await flushPromises()

    const state = timer.getState()
    expect(state.remaining).toEqual(new Duration({ seconds: 1 }))
    expect(state.isRunning).toBe(true)
    expect(state.stage).toBe(PomodoroStage.SHORT_BREAK)
  })

  it('should click start button trigger the closeCurrentTabService', async () => {
    const { wrapper, closeCurrentTabService } = mountPage()

    wrapper.find("[data-test='start-button']").trigger('click')

    expect(closeCurrentTabService.getTriggerCount()).toBe(1)
  })
})

function mountPage({ timerConfig = newTestPomodoroTimerConfig() } = {}) {
  const { scheduler, timer, communicationManager } = startBackgroundListener({
    timerConfig
  })
  const closeCurrentTabService = new FakeActionService()
  const wrapper = mount(ReminderPage, {
    props: {
      port: communicationManager.clientConnect(),
      closeCurrentTabService
    }
  })
  return { wrapper, scheduler, timer, closeCurrentTabService }
}
