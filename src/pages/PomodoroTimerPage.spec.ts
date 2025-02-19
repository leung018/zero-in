import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'
import { FakeCommunicationManager } from '../infra/communication'

describe('PomodoroTimerPage', () => {
  it('should display the time representing focus duration before timer is started', () => {
    const { wrapper } = startListenerAndMountPage({
      focusDuration: new Duration({ minutes: 9 })
    })

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('09:00')
  })

  it('should reduce the time after timer is started', async () => {
    const { wrapper, scheduler } = startListenerAndMountPage({
      focusDuration: new Duration({ minutes: 9 })
    })
    await startTimer(wrapper)

    scheduler.advanceTime(6001)
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('08:54')
  })

  it('should reopened timer page can update the component if the timer is started already', async () => {
    const { wrapper, scheduler, communicationManager } = startListenerAndMountPage({
      focusDuration: new Duration({ minutes: 10 })
    })

    await startTimer(wrapper)

    const newWrapper = mountPage({ port: communicationManager.clientConnect() })

    scheduler.advanceTime(6001)
    await flushPromises()

    expect(newWrapper.find("[data-test='timer-display']").text()).toBe('09:54')
  })

  it('should start button changed to a pause button after timer is started', async () => {
    const { wrapper, communicationManager } = startListenerAndMountPage()

    expect(wrapper.find("[data-test='pause-button']").exists()).toBe(false)
    expect(wrapper.find("[data-test='start-button']").exists()).toBe(true)

    await startTimer(wrapper)

    expect(wrapper.find("[data-test='pause-button']").exists()).toBe(true)
    expect(wrapper.find("[data-test='start-button']").exists()).toBe(false)

    const newWrapper = mountPage({ port: communicationManager.clientConnect() })

    expect(newWrapper.find("[data-test='pause-button']").exists()).toBe(true)
    expect(newWrapper.find("[data-test='start-button']").exists()).toBe(false)
  })

  it('should able to pause the timer', async () => {
    const { wrapper, scheduler, communicationManager } = startListenerAndMountPage({
      focusDuration: new Duration({ minutes: 10 })
    })

    await startTimer(wrapper)

    scheduler.advanceTime(30000)
    await pauseTimer(wrapper)

    scheduler.advanceTime(5000)
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('09:30')

    const newWrapper = mountPage({ port: communicationManager.clientConnect() })
    expect(newWrapper.find("[data-test='timer-display']").text()).toBe('09:30')
  })

  it('should show the start button again after the timer is paused', async () => {
    const { wrapper } = startListenerAndMountPage()

    await startTimer(wrapper)
    await pauseTimer(wrapper)

    expect(wrapper.find("[data-test='start-button']").exists()).toBe(true)
    expect(wrapper.find("[data-test='pause-button']").exists()).toBe(false)
  })
})

function startListenerAndMountPage({ focusDuration = new Duration({ minutes: 25 }) } = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const communicationManager = new FakeCommunicationManager()
  BackgroundListener.createFake({
    scheduler,
    communicationManager,
    focusDuration
  }).start()
  const wrapper = mountPage({ port: communicationManager.clientConnect() })
  return { wrapper, scheduler, communicationManager }
}

function mountPage({ port = new FakeCommunicationManager().clientConnect() } = {}) {
  return mount(PomodoroTimerPage, {
    props: {
      port
    }
  })
}

async function startTimer(wrapper: VueWrapper) {
  const startButton = wrapper.find("[data-test='start-button']")
  startButton.trigger('click')
  await flushPromises()
}

async function pauseTimer(wrapper: VueWrapper) {
  const pauseButton = wrapper.find("[data-test='pause-button']")
  pauseButton.trigger('click')
  await flushPromises()
}
