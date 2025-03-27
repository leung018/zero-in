import { flushPromises, mount } from '@vue/test-utils'
import ReminderPage from './ReminderPage.vue'
import { describe, expect, it } from 'vitest'
import { Duration } from '../domain/pomodoro/duration'
import { PomodoroStage } from '../domain/pomodoro/stage'
import { startBackgroundListener } from '../test_utils/listener'
import { FakeActionService } from '../infra/action'
import { PomodoroTimerConfig } from '../domain/pomodoro/config'
import { PomodoroRecordStorageService } from '../domain/pomodoro/record/storage'
import { newPomodoroRecord } from '../domain/pomodoro/record'
import { Time } from '../domain/time'
import { DailyResetTimeStorageService } from '../domain/daily_reset_time/storage'

describe('ReminderPage', () => {
  it('should display proper reminder', async () => {
    const { scheduler, timer, wrapper } = await mountPage({
      timerConfig: PomodoroTimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 1 }),
        longBreakDuration: new Duration({ seconds: 2 }),
        numOfPomodoriPerCycle: 2
      })
    })

    timer.start()
    scheduler.advanceTime(3001)
    await flushPromises()

    expect(wrapper.find("[data-test='hint-message']").text()).toContain('Take a break')

    timer.start()
    scheduler.advanceTime(1001)
    await flushPromises()

    expect(wrapper.find("[data-test='hint-message']").text()).toContain('Start focusing')

    timer.start()
    scheduler.advanceTime(3001)
    await flushPromises()

    expect(wrapper.find("[data-test='hint-message']").text()).toContain('Take a longer break')
  })

  it('should click start button to start timer again', async () => {
    const { scheduler, timer, wrapper } = await mountPage({
      timerConfig: PomodoroTimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 3 }),
        shortBreakDuration: new Duration({ seconds: 2 }),
        numOfPomodoriPerCycle: 4
      })
    })

    timer.start()
    scheduler.advanceTime(3001)
    await flushPromises()

    expect(timer.getState().isRunning).toBe(false)

    wrapper.find("[data-test='start-button']").trigger('click')
    scheduler.advanceTime(1000)
    await flushPromises()

    const state = timer.getState()
    expect(state.remainingSeconds).toBe(1)
    expect(state.isRunning).toBe(true)
    expect(state.stage).toBe(PomodoroStage.SHORT_BREAK)
  })

  it('should display daily completed pomodori', async () => {
    const pomodoroRecordStorageService = PomodoroRecordStorageService.createFake()
    await pomodoroRecordStorageService.saveAll([
      newPomodoroRecord(new Date(2025, 2, 1, 15, 2)),
      newPomodoroRecord(new Date(2025, 2, 1, 15, 3)),
      newPomodoroRecord(new Date(2025, 2, 1, 15, 5))
    ])

    const { wrapper } = await mountPage({
      pomodoroRecordStorageService,
      dailyCutOffTime: new Time(15, 3),
      currentDate: new Date(2025, 2, 2, 14, 0)
    })
    await flushPromises()

    expect(wrapper.find("[data-test='reset-time']").text()).toBe('15:03')
    expect(wrapper.find("[data-test='daily-completed-pomodori']").text()).toBe('2')
  })

  it('should trigger soundService when mount', async () => {
    const { soundService } = await mountPage()

    expect(soundService.getTriggerCount()).toBe(1)
  })
})

async function mountPage({
  timerConfig = PomodoroTimerConfig.newTestInstance(),
  pomodoroRecordStorageService = PomodoroRecordStorageService.createFake(),
  dailyCutOffTime = new Time(0, 0),
  currentDate = new Date()
} = {}) {
  const { scheduler, timer, communicationManager } = await startBackgroundListener({
    timerConfig
  })
  const closeCurrentTabService = new FakeActionService()
  const soundService = new FakeActionService()
  const dailyResetTimeStorageService = DailyResetTimeStorageService.createFake()
  dailyResetTimeStorageService.save(dailyCutOffTime)

  const wrapper = mount(ReminderPage, {
    props: {
      port: communicationManager.clientConnect(),
      closeCurrentTabService,
      soundService,
      pomodoroRecordStorageService,
      dailyResetTimeStorageService,
      currentDate
    }
  })
  return { wrapper, scheduler, timer, closeCurrentTabService, soundService }
}
