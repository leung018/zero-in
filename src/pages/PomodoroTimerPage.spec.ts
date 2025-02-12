import { flushPromises, mount } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { Timer } from '../domain/pomodoro/timer'

describe('PomodoroTimerPage', () => {
  it('should display the time representing focus duration before timer is started', () => {
    const { wrapper } = mountPomodoroTimerPage({
      focusDuration: new Duration({ minutes: 9 })
    })

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('09:00')
  })

  it('should reduce the time after timer is started', async () => {
    const { wrapper, timer } = mountPomodoroTimerPage({
      focusDuration: new Duration({ minutes: 9 })
    })
    const startButton = wrapper.find("[data-test='start-button']")
    await startButton.trigger('click')
    await flushPromises()

    timer.advanceTime(new Duration({ minutes: 1, seconds: 59 }))
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('07:01')
  })
})

function mountPomodoroTimerPage({
  focusDuration = new Duration({ minutes: 25 }),
  timer = new Timer()
} = {}) {
  const wrapper = mount(PomodoroTimerPage, {
    props: {
      focusDuration,
      timer
    }
  })
  return { wrapper, timer }
}
