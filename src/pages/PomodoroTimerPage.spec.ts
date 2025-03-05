import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import PomodoroTimerPage from './PomodoroTimerPage.vue'
import { expect, describe, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { FakeCommunicationManager } from '../infra/communication'
import { startBackgroundListener } from '../test_utils/listener'
import { newTestPomodoroTimerConfig } from '../domain/pomodoro/config'
import { PomodoroStage } from '../domain/pomodoro/stage'

describe('PomodoroTimerPage', () => {
  it('should display initial stage and remaining time properly', () => {
    const { wrapper } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 9 })
      })
    )

    const timerDisplay = wrapper.find("[data-test='timer-display']")
    expect(timerDisplay.text()).toBe('09:00')

    const pomodoroStage = wrapper.find("[data-test='pomodoro-stage']")
    expect(pomodoroStage.text()).toBe('Focus')
  })

  it('should reduce the time after timer is started', async () => {
    const { wrapper, scheduler } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 9 })
      })
    )
    await startTimer(wrapper)

    scheduler.advanceTime(6001)
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('08:54')
  })

  it('should reopened timer page can update the component if the timer is started already', async () => {
    const { wrapper, scheduler, communicationManager } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

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
    const { wrapper, scheduler, communicationManager } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

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
    const { wrapper, scheduler } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    await startTimer(wrapper)

    scheduler.advanceTime(30000)
    await pauseTimer(wrapper)

    await startTimer(wrapper)
    scheduler.advanceTime(30000)
    await flushPromises()

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('09:00')
  })

  it('should display hint of break if focus duration has passed', async () => {
    const { wrapper, scheduler } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 1 }),
        shortBreakDuration: new Duration({ seconds: 30 }),
        numOfFocusPerCycle: 4
      })
    )

    await startTimer(wrapper)

    scheduler.advanceTime(61000)
    await flushPromises()

    const pomodoroStage = wrapper.find("[data-test='pomodoro-stage']")
    expect(pomodoroStage.text()).toBe('Short Break')
    expect(wrapper.find("[data-test='timer-display']").text()).toBe('00:30')

    assertControlVisibility(wrapper, {
      startButtonVisible: true,
      pauseButtonVisible: false
    })
  })

  it('should prevent bug of last second pause and restart may freezing the component', async () => {
    const { wrapper, scheduler } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 1 }),
        shortBreakDuration: new Duration({ seconds: 30 })
      })
    )

    await startTimer(wrapper)

    scheduler.advanceTime(59500)
    await pauseTimer(wrapper)

    expect(wrapper.find("[data-test='timer-display']").text()).toBe('00:01')

    await startTimer(wrapper)
    scheduler.advanceTime(600)
    await flushPromises()

    const pomodoroStage = wrapper.find("[data-test='pomodoro-stage']")
    expect(wrapper.find("[data-test='timer-display']").text()).toBe('00:30')
    expect(pomodoroStage.text()).toBe('Short Break')
  })

  it('should display hint of long break', async () => {
    const { wrapper, scheduler } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        focusDuration: new Duration({ minutes: 1 }),
        shortBreakDuration: new Duration({ seconds: 15 }),
        longBreakDuration: new Duration({ seconds: 30 }),
        numOfFocusPerCycle: 2
      })
    )

    // 1st Focus
    await startTimer(wrapper)
    scheduler.advanceTime(60000)
    await flushPromises()

    // Short Break
    await startTimer(wrapper)
    scheduler.advanceTime(15000)
    await flushPromises()

    // 2nd Focus
    await startTimer(wrapper)
    scheduler.advanceTime(60000)
    await flushPromises()

    const pomodoroStage = wrapper.find("[data-test='pomodoro-stage']")
    expect(pomodoroStage.text()).toBe('Long Break')
    expect(wrapper.find("[data-test='timer-display']").text()).toBe('00:30')
  })

  it('should render restart focus and short break buttons properly', async () => {
    const { wrapper } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        numOfFocusPerCycle: 3
      })
    )

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
    const { wrapper, timer } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        numOfFocusPerCycle: 3
      })
    )

    await restartFocus(wrapper, 2)

    expect(timer.getState().numOfFocusCompleted).toBe(1)
    expect(timer.getState().stage).toBe(PomodoroStage.FOCUS)

    await restartFocus(wrapper, 3)

    expect(timer.getState().numOfFocusCompleted).toBe(2)
    expect(timer.getState().stage).toBe(PomodoroStage.FOCUS)

    await restartFocus(wrapper, 1)

    expect(timer.getState().numOfFocusCompleted).toBe(0)
    expect(timer.getState().stage).toBe(PomodoroStage.FOCUS)
  })

  it('should able to restart the short break', async () => {
    const { wrapper, timer } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        numOfFocusPerCycle: 4
      })
    )

    await restartShortBreak(wrapper, 1)

    expect(timer.getState().numOfFocusCompleted).toBe(1)
    expect(timer.getState().stage).toBe(PomodoroStage.SHORT_BREAK)

    await restartShortBreak(wrapper, 2)

    expect(timer.getState().numOfFocusCompleted).toBe(2)
    expect(timer.getState().stage).toBe(PomodoroStage.SHORT_BREAK)

    await restartShortBreak(wrapper, 3)

    expect(timer.getState().numOfFocusCompleted).toBe(3)
    expect(timer.getState().stage).toBe(PomodoroStage.SHORT_BREAK)
  })

  it('should able to restart long break', async () => {
    const { wrapper, timer } = startListenerAndMountPage(
      newTestPomodoroTimerConfig({
        numOfFocusPerCycle: 4
      })
    )

    await restartLongBreak(wrapper)

    expect(timer.getState().stage).toBe(PomodoroStage.LONG_BREAK)
  })
})

function startListenerAndMountPage(timerConfig = newTestPomodoroTimerConfig()) {
  const { scheduler, communicationManager, timer } = startBackgroundListener({
    timerConfig
  })
  const wrapper = mountPage({
    port: communicationManager.clientConnect(),
    numOfFocusPerCycle: timerConfig.numOfFocusPerCycle
  })
  return { wrapper, scheduler, communicationManager, timer }
}

function mountPage({
  port = new FakeCommunicationManager().clientConnect(),
  numOfFocusPerCycle = 4
} = {}) {
  return mount(PomodoroTimerPage, {
    props: {
      port,
      numOfFocusPerCycle
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
