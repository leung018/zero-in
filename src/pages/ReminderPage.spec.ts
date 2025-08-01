import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { DailyResetTimeStorageService } from '../domain/daily_reset_time/storage'
import { Time } from '../domain/time'
import { TimerConfig } from '../domain/timer/config'
import { Duration } from '../domain/timer/duration'
import { newFocusSessionRecord } from '../domain/timer/record'
import { TimerStage } from '../domain/timer/stage'
import { FakeActionService } from '../infra/action'
import { setUpListener } from '../test_utils/listener'
import { dataTestSelector } from '../test_utils/selector'
import ReminderPage from './ReminderPage.vue'

describe('ReminderPage', () => {
  it('should display proper reminder', async () => {
    const { scheduler, timer, wrapper } = await mountPage({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 2
      })
    })

    timer.start()
    scheduler.advanceTime(3001)
    await flushPromises()

    expect(wrapper.find(dataTestSelector('hint-message')).text()).toContain('Start 1st Break')
  })

  it('should click start button to start timer again', async () => {
    const { scheduler, timer, wrapper } = await mountPage({
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 2 }),
        focusSessionsPerCycle: 4
      })
    })

    timer.start()
    scheduler.advanceTime(3001)
    await flushPromises()

    expect(timer.getState().isRunning).toBe(false)

    wrapper.find(dataTestSelector('start-button')).trigger('click')
    scheduler.advanceTime(1000)
    await flushPromises()

    const state = timer.getState()
    expect(state.remaining.remainingSeconds()).toBe(1)
    expect(state.isRunning).toBe(true)
    expect(state.stage).toBe(TimerStage.SHORT_BREAK)
  })

  it('should display daily completed focus sessions', async () => {
    const { wrapper } = await mountPage({
      focusSessionRecords: [
        newFocusSessionRecord(new Date(2025, 2, 1, 15, 2)),
        newFocusSessionRecord(new Date(2025, 2, 1, 15, 3)),
        newFocusSessionRecord(new Date(2025, 2, 1, 15, 5))
      ],
      dailyCutOffTime: new Time(15, 3),
      currentDate: new Date(2025, 2, 2, 14, 0)
    })

    expect(wrapper.find(dataTestSelector('reset-time')).text()).toBe('15:03')
    expect(wrapper.find(dataTestSelector('daily-completed-focus-sessions')).text()).toBe('2')
  })
})

async function mountPage({
  timerConfig = TimerConfig.newTestInstance(),
  focusSessionRecords = [newFocusSessionRecord()],
  dailyCutOffTime = new Time(0, 0),
  currentDate = new Date()
} = {}) {
  const {
    scheduler,
    timer,
    communicationManager,
    listener,
    focusSessionRecordStorageService,
    currentDateService
  } = await setUpListener({
    timerConfig,
    stubbedDate: currentDate
  })
  const dailyResetTimeStorageService = DailyResetTimeStorageService.createFake()
  await dailyResetTimeStorageService.save(dailyCutOffTime)

  await focusSessionRecordStorageService.saveAll(focusSessionRecords)

  await listener.start()

  const closeCurrentTabService = new FakeActionService()

  const wrapper = mount(ReminderPage, {
    props: {
      port: communicationManager.clientConnect(),
      closeCurrentTabService,
      focusSessionRecordStorageService,
      dailyResetTimeStorageService,
      currentDateService
    }
  })
  await flushPromises()
  return { wrapper, scheduler, timer, closeCurrentTabService }
}
