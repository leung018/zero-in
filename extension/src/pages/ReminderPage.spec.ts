import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Time } from '@shared/domain/time'
import { TimerConfig } from '../domain/timer/config'
import { Duration } from '../domain/timer/duration'
import { newFocusSessionRecord } from '../domain/timer/record'
import { TimerStage } from '../domain/timer/stage'
import { FakeActionService } from '../infra/action'
import { fakeDailyResetTimeStorageService } from '../infra/storage/factories/fake'
import { setUpListener } from '../test_utils/listener'
import { dataTestSelector } from '../test_utils/selector'
import ReminderPage from './ReminderPage.vue'

describe('ReminderPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should display proper reminder', async () => {
    const { timer, wrapper } = await mountPage({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 2
      })
    })

    timer.start()
    vi.advanceTimersByTime(3001)
    await flushPromises()

    expect(wrapper.find(dataTestSelector('hint-message')).text()).toContain('Start 1st Break')
  })

  it('should click start button to start timer again', async () => {
    const { timer, wrapper } = await mountPage({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 4
      })
    })

    timer.start()
    vi.advanceTimersByTime(3001)
    await flushPromises()

    expect(timer.getExternalState().isRunning).toBe(false)

    wrapper.find(dataTestSelector('start-button')).trigger('click')
    vi.advanceTimersByTime(1000)
    await flushPromises()

    const state = timer.getExternalState()
    expect(state.remaining.remainingSeconds()).toBe(1)
    expect(state.isRunning).toBe(true)
    expect(state.stage).toBe(TimerStage.SHORT_BREAK)
  })

  it('should display daily completed focus sessions', async () => {
    vi.setSystemTime(new Date(2025, 2, 2, 14, 0))
    const { wrapper } = await mountPage({
      focusSessionRecords: [
        newFocusSessionRecord({ completedAt: new Date(2025, 2, 1, 15, 2) }),
        newFocusSessionRecord({ completedAt: new Date(2025, 2, 1, 15, 3) }),
        newFocusSessionRecord({ completedAt: new Date(2025, 2, 1, 15, 5) })
      ],
      dailyCutOffTime: new Time(15, 3)
    })

    expect(wrapper.find(dataTestSelector('reset-time')).text()).toBe('15:03')
    expect(wrapper.find(dataTestSelector('daily-completed-focus-sessions')).text()).toBe('2')
  })
})

async function mountPage({
  timerConfig = TimerConfig.newTestInstance(),
  focusSessionRecords = [newFocusSessionRecord()],
  dailyCutOffTime = new Time(0, 0)
} = {}) {
  const { timer, communicationManager, listener, focusSessionRecordsStorageService } =
    await setUpListener({
      timerConfig
    })
  const dailyResetTimeStorageService = fakeDailyResetTimeStorageService()
  await dailyResetTimeStorageService.save(dailyCutOffTime)

  await focusSessionRecordsStorageService.save(focusSessionRecords)

  await listener.start()

  const closeCurrentTabService = new FakeActionService()

  const wrapper = mount(ReminderPage, {
    props: {
      port: communicationManager.clientConnect(),
      closeCurrentTabService,
      focusSessionRecordsStorageService,
      dailyResetTimeStorageService
    }
  })
  await flushPromises()
  return { wrapper, timer, closeCurrentTabService }
}
