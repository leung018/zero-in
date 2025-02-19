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

    assertControlVisibility(wrapper, {
      startButtonVisible: true,
      pauseButtonVisible: false
    })

    await startTimer(wrapper)

    assertControlVisibility(wrapper, {
      startButtonVisible: false,
      pauseButtonVisible: true
    })

    const newWrapper = mountPage({ port: communicationManager.clientConnect() })

    assertControlVisibility(newWrapper, {
      startButtonVisible: false,
      pauseButtonVisible: true
    })
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
    const { wrapper, communicationManager } = startListenerAndMountPage()

    await startTimer(wrapper)
    await pauseTimer(wrapper)

    assertControlVisibility(wrapper, {
      startButtonVisible: true,
      pauseButtonVisible: false
    })

    const newWrapper = mountPage({ port: communicationManager.clientConnect() })
    assertControlVisibility(newWrapper, {
      startButtonVisible: true,
      pauseButtonVisible: false
    })
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

function assertControlVisibility(
  wrapper: VueWrapper,
  {
    startButtonVisible,
    pauseButtonVisible
  }: { startButtonVisible: boolean; pauseButtonVisible: boolean }
) {
  expect(wrapper.find("[data-test='start-button']").exists()).toBe(startButtonVisible)
  expect(wrapper.find("[data-test='pause-button']").exists()).toBe(pauseButtonVisible)
}
