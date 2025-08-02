import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { TimerConfig } from '../domain/timer/config'
import { Duration } from '../domain/timer/duration'
import { FakeCommunicationManager } from '../infra/communication'
import { setUpListener } from '../test_utils/listener'
import { dataTestSelector } from '../test_utils/selector'
import FocusTimerPage from './FocusTimerPage.vue'

describe('FocusTimerPage', () => {
  it('should display initial stage and remaining time properly', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 9 }),
        focusSessionsPerCycle: 4
      })
    )

    assertTimerDisplay(wrapper, '09:00')

    assertCurrentStage(wrapper, '1st Focus')
  })

  it('should reduce the time after timer is started', async () => {
    const { wrapper, clock } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 25 })
      })
    )
    await startTimer(wrapper)

    clock.advanceTime(2001)
    await flushPromises()

    assertTimerDisplay(wrapper, '24:58')
  })

  it('should reopened timer page can update the component if the timer is started already', async () => {
    const { wrapper, clock, communicationManager } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    await startTimer(wrapper)

    const newWrapper = await mountPage({ port: communicationManager.clientConnect() })

    clock.advanceTime(1001)
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

    const newWrapper = await mountPage({ port: communicationManager.clientConnect() })

    assertControlVisibility(newWrapper, {
      startButtonVisible: false,
      pauseButtonVisible: true
    })
  })

  it('should able to pause the timer', async () => {
    const { wrapper, clock, communicationManager } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    await startTimer(wrapper)

    clock.advanceTime(1000)
    await pauseTimer(wrapper)

    clock.advanceTime(2000)
    await flushPromises()

    assertTimerDisplay(wrapper, '09:59')

    const newWrapper = await mountPage({ port: communicationManager.clientConnect() })
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

    const newWrapper = await mountPage({ port: communicationManager.clientConnect() })
    assertControlVisibility(newWrapper, {
      startButtonVisible: true,
      pauseButtonVisible: false
    })
  })

  it('should able to restart timer', async () => {
    const { wrapper, clock } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 10 })
      })
    )

    await startTimer(wrapper)

    clock.advanceTime(500)
    await pauseTimer(wrapper)

    await startTimer(wrapper)
    clock.advanceTime(500)
    await flushPromises()

    assertTimerDisplay(wrapper, '09:59')
  })

  it('should display hint of break if focus duration has passed', async () => {
    const { wrapper, clock } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 2 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        focusSessionsPerCycle: 4
      })
    )

    await startTimer(wrapper)

    clock.advanceTime(2000)
    await flushPromises()

    assertCurrentStage(wrapper, '1st Break')

    expect(wrapper.find(dataTestSelector('timer-display')).text()).toBe('00:01')

    assertControlVisibility(wrapper, {
      startButtonVisible: true,
      pauseButtonVisible: false
    })
  })

  it('should display focus and break without Ordinal if focus sessions per cycle is 1', async () => {
    const { wrapper, clock } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 1
      })
    )

    assertCurrentStage(wrapper, 'Focus')

    await startTimer(wrapper)

    clock.advanceTime(2000)
    await flushPromises()

    assertCurrentStage(wrapper, 'Break')
  })

  it('should prevent bug of last second pause and restart may freezing the component', async () => {
    const { wrapper, clock } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 2 })
      })
    )

    await startTimer(wrapper)

    clock.advanceTime(2500)
    await pauseTimer(wrapper)

    assertTimerDisplay(wrapper, '00:01')

    await startTimer(wrapper)
    clock.advanceTime(600)
    await flushPromises()

    assertTimerDisplay(wrapper, '00:02')
  })

  it('should display hint of long break', async () => {
    const { wrapper, clock } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 2
      })
    )

    // 1st Focus
    await startTimer(wrapper)
    clock.advanceTime(3000)
    await flushPromises()

    // Short Break
    await startTimer(wrapper)
    clock.advanceTime(1000)
    await flushPromises()

    // 2nd Focus
    await startTimer(wrapper)
    clock.advanceTime(3000)
    await flushPromises()

    assertCurrentStage(wrapper, 'Long Break')
    assertTimerDisplay(wrapper, '00:02')
  })

  it('should render restart focus and break buttons properly if focus session per cycle larger than 1', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 3
      })
    )

    const focusButtons = wrapper.findAll(dataTestSelector('restart-focus'))

    expect(focusButtons).toHaveLength(3)

    expect(focusButtons[0].text()).toBe('1st Focus')
    expect(focusButtons[1].text()).toBe('2nd Focus')
    expect(focusButtons[2].text()).toBe('3rd Focus')

    const shortBreakButtons = wrapper.findAll(dataTestSelector('restart-short-break'))

    expect(shortBreakButtons).toHaveLength(2)

    expect(shortBreakButtons[0].text()).toBe('1st Break')
    expect(shortBreakButtons[1].text()).toBe('2nd Break')

    const longBreakButton = wrapper.find(dataTestSelector('restart-long-break'))
    expect(longBreakButton.text()).toBe('Long Break')
  })

  it('should render restart focus and break buttons properly if focus session per cycle is 1', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 1
      })
    )

    const focusButtons = wrapper.findAll(dataTestSelector('restart-focus'))

    expect(focusButtons).toHaveLength(1)
    expect(focusButtons[0].text()).toBe('Focus')

    const shortBreakButtons = wrapper.findAll(dataTestSelector('restart-short-break'))
    expect(shortBreakButtons).toHaveLength(0)

    const longBreakButton = wrapper.find(dataTestSelector('restart-long-break'))
    expect(longBreakButton.text()).toBe('Break')
  })

  it('should able to restart the focus', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 3
      })
    )

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

    await restartShortBreak(wrapper, 1)
    assertCurrentStage(wrapper, '1st Break')

    await restartShortBreak(wrapper, 2)
    assertCurrentStage(wrapper, '2nd Break')

    await restartShortBreak(wrapper, 3)
    assertCurrentStage(wrapper, '3rd Break')
  })

  it('should able to restart long break', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 4
      })
    )

    await restartLongBreak(wrapper)
    assertCurrentStage(wrapper, 'Long Break')
  })

  it('should able to restart break and focus if focus session per cycle is 1', async () => {
    const { wrapper } = await startListenerAndMountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 1
      })
    )

    await restartFocus(wrapper, 1)
    assertCurrentStage(wrapper, 'Focus')

    await restartLongBreak(wrapper)
    assertCurrentStage(wrapper, 'Break')

    await restartFocus(wrapper, 1)
    assertCurrentStage(wrapper, 'Focus')
  })
})

async function startListenerAndMountPage(timerConfig = TimerConfig.newTestInstance()) {
  const { clock, communicationManager, listener } = await setUpListener({
    timerConfig
  })
  await listener.start()
  const wrapper = await mountPage({
    port: communicationManager.clientConnect()
  })
  return { wrapper, clock, communicationManager }
}

async function mountPage({ port = new FakeCommunicationManager().clientConnect() } = {}) {
  const wrapper = mount(FocusTimerPage, {
    props: {
      port
    }
  })
  await flushPromises()
  return wrapper
}

async function startTimer(wrapper: VueWrapper) {
  const startButton = wrapper.find(dataTestSelector('start-button'))
  startButton.trigger('click')
  await flushPromises()
}

async function pauseTimer(wrapper: VueWrapper) {
  const pauseButton = wrapper.find(dataTestSelector('pause-button'))
  pauseButton.trigger('click')
  await flushPromises()
}

async function restartFocus(wrapper: VueWrapper, nth: number) {
  const restartButtons = wrapper.findAll(dataTestSelector('restart-focus'))
  restartButtons[nth - 1].trigger('click')
  await flushPromises()
}

async function restartShortBreak(wrapper: VueWrapper, nth: number) {
  const restartButtons = wrapper.findAll(dataTestSelector('restart-short-break'))
  restartButtons[nth - 1].trigger('click')
  await flushPromises()
}

async function restartLongBreak(wrapper: VueWrapper) {
  const restartButton = wrapper.find(dataTestSelector('restart-long-break'))
  restartButton.trigger('click')
  await flushPromises()
}

function assertTimerDisplay(wrapper: VueWrapper, time: string) {
  const timerDisplay = wrapper.find(dataTestSelector('timer-display'))
  expect(timerDisplay.text()).toBe(time)
}

function assertCurrentStage(wrapper: VueWrapper, stage: string) {
  const timerStage = wrapper.find(dataTestSelector('current-stage'))
  expect(timerStage.text()).toBe(stage)
}

function assertControlVisibility(
  wrapper: VueWrapper,
  {
    startButtonVisible,
    pauseButtonVisible
  }: { startButtonVisible: boolean; pauseButtonVisible: boolean }
) {
  expect(wrapper.find(dataTestSelector('start-button')).exists()).toBe(startButtonVisible)
  expect(wrapper.find(dataTestSelector('pause-button')).exists()).toBe(pauseButtonVisible)
}
