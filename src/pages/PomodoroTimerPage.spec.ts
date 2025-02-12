import { flushPromises, mount } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { Timer } from '../domain/pomodoro/timer'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'

describe('PomodoroTimerPage', () => {
  it('should display the time representing focus duration before timer is started', () => {
    const { wrapper } = mountPomodoroTimerPage({
      focusDuration: new Duration({ minutes: 9 })
    })

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('09:00')
  })

  it('should reduce the time after timer is started', async () => {
    const scheduler = new FakePeriodicTaskScheduler()
    const { wrapper } = mountPomodoroTimerPage({
      focusDuration: new Duration({ minutes: 9 }),
      scheduler
    })
    const startButton = wrapper.find("[data-test='start-button']")
    await startButton.trigger('click')
    await flushPromises()

    scheduler.triggerNext()
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('08:59')

    scheduler.triggerNext()
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('08:58')
  })
})

function mountPomodoroTimerPage({
  focusDuration = new Duration({ minutes: 25 }),
  scheduler = new FakePeriodicTaskScheduler()
} = {}) {
  const timer = Timer.createFake(scheduler)
  const wrapper = mount(PomodoroTimerPage, {
    props: {
      focusDuration,
      timer
    }
  })
  return { wrapper, timer }
}
