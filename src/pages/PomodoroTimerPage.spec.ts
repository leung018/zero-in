import { flushPromises, mount } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'
import { FakeCommunicationManager } from '../infra/communication'

describe('PomodoroTimerPage', () => {
  it('should display the time representing focus duration before timer is started', () => {
    const { wrapper } = mountPomodoroTimerPage({
      focusDuration: new Duration({ minutes: 9 })
    })

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('09:00')
  })

  it('should reduce the time after timer is started', async () => {
    const { wrapper, scheduler } = mountPomodoroTimerPage({
      focusDuration: new Duration({ minutes: 9 })
    })
    const startButton = wrapper.find("[data-test='start-button']")
    await startButton.trigger('click')
    await flushPromises()

    scheduler.advanceTime(6001)
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('08:54')
  })
})

function mountPomodoroTimerPage({ focusDuration = new Duration({ minutes: 25 }) } = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const communicationManager = new FakeCommunicationManager()
  BackgroundListener.createFake({
    scheduler,
    communicationManager
  }).start()
  const wrapper = mount(PomodoroTimerPage, {
    props: {
      focusDuration,
      port: communicationManager.clientConnect()
    }
  })
  return { wrapper, scheduler }
}
