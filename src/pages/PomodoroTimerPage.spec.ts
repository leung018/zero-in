import { mount } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'

describe('PomodoroTimerPage', () => {
  it('should display the time representing focus duration before timer is started', () => {
    const { wrapper } = mountPomodoroTimerPage({
      focusDuration: new Duration({ minutes: 9 })
    })

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('09:00')
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
