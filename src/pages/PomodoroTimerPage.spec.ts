import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { FakeCommunicationManager } from '../infra/communication'
import { startBackgroundListener } from '../test_utils/listener'
import { TimerConfig } from '../domain/pomodoro/config'
import { TimerConfigStorageService } from '../domain/pomodoro/config/storage'

describe('PomodoroTimerPage', () => {
  it('should display initial stage and remaining time properly', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 9 })
      })
    )

    assertTimerDisplay(wrapper, '09:00')

    assertCurrentStage(wrapper, '1st Focus')
  })

  it('should reduce the time after timer is started', async () => {
    const { wrapper, scheduler } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 25 })
      })
    )
    await startTimer(wrapper)

    scheduler.advanceTime(2001)
    await flushPromises()

    assertTimerDisplay(wrapper, '24:58')
  })

  it('should reopened timer page can update the component if the timer is started already', async () => {
    const { wrapper, scheduler, communicationManager } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    await startTimer(wrapper)

    const newWrapper = mountPage({ port: communicationManager.clientConnect() })

    scheduler.advanceTime(1001)
    await flushPromises()

    assertTimerDisplay(newWrapper, '09:59')
  })

  it('should start button changed to a pause button after timer is started', async () => {
    const { wrapper, communicationManager } = await startListenerAndMountPage()

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
    const { wrapper, scheduler, communicationManager } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    await startTimer(wrapper)

    scheduler.advanceTime(1000)
    await pauseTimer(wrapper)

    scheduler.advanceTime(2000)
    await flushPromises()

    assertTimerDisplay(wrapper, '09:59')

    const newWrapper = mountPage({ port: communicationManager.clientConnect() })
    assertTimerDisplay(newWrapper, '09:59')
  })

  it('should show the start button again after the timer is paused', async () => {
    const { wrapper, communicationManager } = await startListenerAndMountPage()

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
    const { wrapper, scheduler } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    await startTimer(wrapper)

    scheduler.advanceTime(500)
    await pauseTimer(wrapper)

    await startTimer(wrapper)
    scheduler.advanceTime(500)
    await flushPromises()

    assertTimerDisplay(wrapper, '09:59')
  })

  it('should display hint of break if focus duration has passed', async () => {
    const { wrapper, scheduler } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 2 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        focusSessionsPerCycle: 4
      })
    )

    await startTimer(wrapper)

    scheduler.advanceTime(2000)
    await flushPromises()

    assertCurrentStage(wrapper, '1st Short Break')

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('00:01')

    assertControlVisibility(wrapper, {
      startButtonVisible: true,
      pauseButtonVisible: false
    })
  })

  it('should prevent bug of last second pause and restart may freezing the component', async () => {
    const { wrapper, scheduler } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 2 })
      })
    )

    await startTimer(wrapper)

    scheduler.advanceTime(2500)
    await pauseTimer(wrapper)

    assertTimerDisplay(wrapper, '00:01')

    await startTimer(wrapper)
    scheduler.advanceTime(600)
    await flushPromises()

    assertTimerDisplay(wrapper, '00:02')
  })

  it('should display hint of long break', async () => {
    const { wrapper, scheduler } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 2
      })
    )

    // 1st Focus
    await startTimer(wrapper)
    scheduler.advanceTime(3000)
    await flushPromises()

    // Short Break
    await startTimer(wrapper)
    scheduler.advanceTime(1000)
    await flushPromises()

    // 2nd Focus
    await startTimer(wrapper)
    scheduler.advanceTime(3000)
    await flushPromises()

    assertCurrentStage(wrapper, 'Long Break')
    assertTimerDisplay(wrapper, '00:02')
  })

  it('should render restart focus and short break buttons properly', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 3
      })
    )
    await flushPromises()

    const focusButtons = wrapper.findAll("[data-test='restart-focus']")

    expect(focusButtons).toHaveLength(3)

    expect(focusButtons[0].text()).toBe('1st Focus')
    expect(focusButtons[1].text()).toBe('2nd Focus')
    expect(focusButtons[2].text()).toBe('3rd Focus')

    const shortBreakButtons = wrapper.findAll("[data-test='restart-short-break']")

    expect(shortBreakButtons).toHaveLength(2)

    expect(shortBreakButtons[0].text()).toBe('1st Break')
    expect(shortBreakButtons[1].text()).toBe('2nd Break')
  })

  it('should able to restart the focus', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 3
      })
    )
    await flushPromises()

    await restartFocus(wrapper, 2)
    assertCurrentStage(wrapper, '2nd Focus')

    await restartFocus(wrapper, 3)
    assertCurrentStage(wrapper, '3rd Focus')

    await restartFocus(wrapper, 1)
    assertCurrentStage(wrapper, '1st Focus')
  })

  it('should able to restart the short break', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 4
      })
    )
    await flushPromises()

    await restartShortBreak(wrapper, 1)
    assertCurrentStage(wrapper, '1st Short Break')

    await restartShortBreak(wrapper, 2)
    assertCurrentStage(wrapper, '2nd Short Break')

    await restartShortBreak(wrapper, 3)
    assertCurrentStage(wrapper, '3rd Short Break')
  })

  it('should able to restart long break', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 4
      })
    )
    await flushPromises()

    await restartLongBreak(wrapper)
    assertCurrentStage(wrapper, 'Long Break')
  })
})

async function startListenerAndMountPage(timerConfig = TimerConfig.newTestInstance()) {
  const { scheduler, communicationManager, timerConfigStorageService } =
    await startBackgroundListener({
      timerConfig
    })
  const wrapper = mountPage({
    port: communicationManager.clientConnect(),
    timerConfigStorageService
  })
  return { wrapper, scheduler, communicationManager }
}

function mountPage({
  port = new FakeCommunicationManager().clientConnect(),
  timerConfigStorageService = TimerConfigStorageService.createFake()
} = {}) {
  return mount(PomodoroTimerPage, {
    props: {
      port,
      timerConfigStorageService
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

async function restartFocus(wrapper: VueWrapper, nth: number) {
  const restartButtons = wrapper.findAll("[data-test='restart-focus']")
  restartButtons[nth - 1].trigger('click')
  await flushPromises()
}

async function restartShortBreak(wrapper: VueWrapper, nth: number) {
  const restartButtons = wrapper.findAll("[data-test='restart-short-break']")
  restartButtons[nth - 1].trigger('click')
  await flushPromises()
}

async function restartLongBreak(wrapper: VueWrapper) {
  const restartButton = wrapper.find("[data-test='restart-long-break']")
  restartButton.trigger('click')
  await flushPromises()
}

function assertTimerDisplay(wrapper: VueWrapper, time: string) {
  const timerDisplay = wrapper.find("[data-test='timer-display']")
  expect(timerDisplay.text()).toBe(time)
}

function assertCurrentStage(wrapper: VueWrapper, stage: string) {
  const pomodoroStage = wrapper.find("[data-test='current-stage']")
  expect(pomodoroStage.text()).toBe(stage)
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
