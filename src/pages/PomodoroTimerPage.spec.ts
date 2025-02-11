import { mount } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'

describe('PomodoroTimerPage', () => {
  it('should start the timer', () => {
    const { wrapper } = mountPomodoroTimerPage()

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('25:00')

    const startButton = wrapper.find("[data-test='start-button']")
    startButton.trigger('click')

    // TODO
  })
})

function mountPomodoroTimerPage() {
  const wrapper = mount(PomodoroTimerPage, {})
  return { wrapper }
}
