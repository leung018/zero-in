import { flushPromises, mount } from '@vue/test-utils'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'
import { FakeCommunicationManager } from '../infra/communication'
import ReminderPage from './ReminderPage.vue'
import { describe, expect, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { PomodoroStage } from '../domain/pomodoro/stage'
import { FakeActionService } from '../infra/action'

describe('ReminderPage', () => {
  it('should display proper reminder', async () => {
    const { scheduler, timer, wrapper } = mountPage({
      focusDuration: new Duration({ minutes: 1 }),
      restDuration: new Duration({ seconds: 30 })
    })

    timer.start()
    scheduler.advanceTime(60001)
    await flushPromises()

    expect(wrapper.find("[data-test='hint-message']").text()).toContain('break')

    timer.start()
    scheduler.advanceTime(30001)
    await flushPromises()

    expect(wrapper.find("[data-test='hint-message']").text()).toContain('focus')
  })

  it('should click start button to start timer again', async () => {
    const { scheduler, timer, wrapper } = mountPage({
      focusDuration: new Duration({ minutes: 1 }),
      restDuration: new Duration({ seconds: 30 })
    })

    timer.start()
    scheduler.advanceTime(60001)
    await flushPromises()

    expect(timer.getState().isRunning).toBe(false)

    wrapper.find("[data-test='start-button']").trigger('click')
    scheduler.advanceTime(1000)
    await flushPromises()

    expect(timer.getState()).toEqual({
      remaining: new Duration({ seconds: 29 }),
      isRunning: true,
      stage: PomodoroStage.REST
    })
  })

  it('should click start button trigger the closeCurrentTabService', async () => {
    const { wrapper, closeCurrentTabService } = mountPage()

    wrapper.find("[data-test='start-button']").trigger('click')

    expect(closeCurrentTabService.getTriggerCount()).toBe(1)
  })
})

function mountPage({
  focusDuration = new Duration({ minutes: 25 }),
  restDuration = new Duration({ minutes: 5 })
} = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const communicationManager = new FakeCommunicationManager()
  const timer = PomodoroTimer.createFake({
    scheduler,
    focusDuration,
    restDuration
  })

  BackgroundListener.createFake({
    timer,
    communicationManager
  }).start()

  const closeCurrentTabService = new FakeActionService()
  const wrapper = mount(ReminderPage, {
    props: {
      port: communicationManager.clientConnect(),
      closeCurrentTabService
    }
  })
  return { wrapper, scheduler, timer, closeCurrentTabService }
}
