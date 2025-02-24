import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { BackgroundListener } from '../service_workers/listener'
import { FakeCommunicationManager } from '../infra/communication'
import { FakeReminderService } from '../infra/reminder'
import { PomodoroTimer } from '../domain/pomodoro/timer'

describe('PomodoroTimerPage', () => {
  it('should display initial state and timer properly', () => {
    const { wrapper } = startListenerAndMountPage({
      focusDuration: new Duration({ minutes: 9 })
    })

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('09:00')

    const pomodoroState = wrapper.find("[data-test='pomodoro-state']")
    expect(pomodoroState.text()).toBe('Focus')
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

    scheduler.advanceTime(30500)
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

  it('should able to restart timer', async () => {
    const { wrapper, scheduler } = startListenerAndMountPage({
      focusDuration: new Duration({ minutes: 10 })
    })

    await startTimer(wrapper)

    scheduler.advanceTime(30000)
    await pauseTimer(wrapper)

    await startTimer(wrapper)
    scheduler.advanceTime(30000)
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('09:00')
  })

  it('should display hint of rest if focus duration has passed', async () => {
    const { wrapper, scheduler, reminderService } = startListenerAndMountPage({
      focusDuration: new Duration({ minutes: 1 }),
      restDuration: new Duration({ seconds: 30 })
    })

    await startTimer(wrapper)

    scheduler.advanceTime(61000)
    await flushPromises()

    const pomodoroState = wrapper.find("[data-test='pomodoro-state']")
    expect(pomodoroState.text()).toBe('Take a Break')
    expect(wrapper.find("[data-test='timer-display']").text()).toBe('00:30')

    assertControlVisibility(wrapper, {
      startButtonVisible: true,
      pauseButtonVisible: false
    })

    expect(reminderService.getTriggerCount()).toBe(1)
  })

  it('should prevent bug of last second pause and restart may freezing the component', async () => {
    const { wrapper, scheduler } = startListenerAndMountPage({
      focusDuration: new Duration({ minutes: 1 }),
      restDuration: new Duration({ seconds: 30 })
    })

    await startTimer(wrapper)

    scheduler.advanceTime(59500)
    await pauseTimer(wrapper)

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('00:01')

    await startTimer(wrapper)
    scheduler.advanceTime(600)
    await flushPromises()

    const pomodoroState = wrapper.find("[data-test='pomodoro-state']")
    expect(wrapper.find("[data-test='timer-display']").text()).toBe('00:30')
    expect(pomodoroState.text()).toBe('Take a Break')
  })
})

function startListenerAndMountPage({
  focusDuration = new Duration({ minutes: 25 }),
  restDuration = new Duration({ minutes: 5 })
} = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const communicationManager = new FakeCommunicationManager()
  const reminderService = new FakeReminderService()
  const timer = PomodoroTimer.createFake({
    scheduler,
    focusDuration,
    restDuration
  })
  BackgroundListener.createFake({
    timer,
    communicationManager,
    reminderService
  }).start()
  const wrapper = mountPage({ port: communicationManager.clientConnect() })
  return { wrapper, scheduler, communicationManager, reminderService }
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
