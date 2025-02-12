import { mount } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'

describe('PomodoroTimerPage', () => {
  it('should start the timer', () => {
    const { wrapper } = mountPomodoroTimerPage({
      focusDuration: new Duration({ minutes: 9 })
    })

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('09:00')

    const startButton = wrapper.find("[data-test='start-button']")
    startButton.trigger('click')

    // TODO
  })
})

function mountPomodoroTimerPage({ focusDuration = new Duration({ minutes: 25 }) } = {}) {
  const wrapper = mount(PomodoroTimerPage, {
    props: {
      focusDuration
    }
  })
  return { wrapper }
}
