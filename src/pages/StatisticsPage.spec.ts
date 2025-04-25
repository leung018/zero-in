import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { DailyResetTimeStorageService } from '../domain/daily_reset_time/storage'
import { TimerConfig } from '../domain/pomodoro/config'
import { Duration } from '../domain/pomodoro/duration'
import { newFocusSessionRecord, type FocusSessionRecord } from '../domain/pomodoro/record'
import { Time } from '../domain/time'
import { FakeActionService } from '../infra/action'
import { CurrentDateService } from '../infra/current_date'
import { setUpListener } from '../test_utils/listener'
import StatisticsPage from './StatisticsPage.vue'
import { dataTestSelector } from '../test_utils/selector'
import { assertSelectorInputValue } from '../test_utils/assert'

describe('StatisticsPage', () => {
  it('should render saved daily reset time', async () => {
    const { wrapper } = await mountStatisticsPage({
      dailyResetTime: new Time(10, 30)
    })

    assertSelectorInputValue(wrapper, dataTestSelector('time-input'), '10:30')
  })

  it('should able to save daily reset time', async () => {
    const { wrapper, dailyResetTimeStorageService } = await mountStatisticsPage()

    await saveTime(wrapper, '09:05')

    expect(await dailyResetTimeStorageService.get()).toEqual(new Time(9, 5))
  })

  it('should reload page after clicked save', async () => {
    const { wrapper, reloadService } = await mountStatisticsPage()

    expect(reloadService.getTriggerCount()).toBe(0)

    await saveTime(wrapper, '15:05')

    expect(reloadService.getTriggerCount()).toBe(1)
  })

  it('should render stats table with rows represent last 7 days', async () => {
    const { wrapper } = await mountStatisticsPage()

    const rows = wrapper.find('tbody').findAll('tr')
    expect(rows).toHaveLength(7)

    expect(rows[0].find(dataTestSelector('day-field')).text()).toBe('Today')
    expect(rows[1].find(dataTestSelector('day-field')).text()).toBe('Yesterday')
    expect(rows[2].find(dataTestSelector('day-field')).text()).toBe('2 days ago')
    expect(rows[3].find(dataTestSelector('day-field')).text()).toBe('3 days ago')
    expect(rows[4].find(dataTestSelector('day-field')).text()).toBe('4 days ago')
    expect(rows[5].find(dataTestSelector('day-field')).text()).toBe('5 days ago')
    expect(rows[6].find(dataTestSelector('day-field')).text()).toBe('6 days ago')
  })

  it('should render stat of last 7 day', async () => {
    const focusSessionRecords: FocusSessionRecord[] = [
      { completedAt: new Date(2025, 3, 4, 10, 29) },

      { completedAt: new Date(2025, 3, 4, 10, 30) },
      { completedAt: new Date(2025, 3, 4, 10, 31) },

      { completedAt: new Date(2025, 3, 6, 11, 0) },
      { completedAt: new Date(2025, 3, 7, 10, 29) },

      { completedAt: new Date(2025, 3, 11, 8, 24) }
    ]

    // When current time hasn't reached the daily reset time that day.
    const { wrapper } = await mountStatisticsPage({
      dailyResetTime: new Time(10, 30),
      focusSessionRecords,
      currentDate: new Date(2025, 3, 11, 9, 0)
    })

    const rows = wrapper.find('tbody').findAll('tr')
    expect(rows[0].find(dataTestSelector('completed-pomodori-field')).text()).toBe('1') // 2025-04-10 10:30 - now
    expect(rows[1].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-09 10:30 - 2025-04-10 10:29
    expect(rows[2].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-08 10:30 - 2025-04-09 10:29
    expect(rows[3].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-07 10:30 - 2025-04-08 10:29
    expect(rows[4].find(dataTestSelector('completed-pomodori-field')).text()).toBe('2') // 2025-04-06 10:30 - 2025-04-07 10:29
    expect(rows[5].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-05 10:30 - 2025-04-06 10:29
    expect(rows[6].find(dataTestSelector('completed-pomodori-field')).text()).toBe('2') // 2025-04-04 10:30 - 2025-04-05 10:29

    // When current time has reached the daily reset time that day.
    const { wrapper: newWrapper } = await mountStatisticsPage({
      dailyResetTime: new Time(10, 30),
      focusSessionRecords,
      currentDate: new Date(2025, 3, 11, 10, 30)
    })

    const newRows = newWrapper.find('tbody').findAll('tr')
    expect(newRows[0].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-11 10:30 - now
    expect(newRows[1].find(dataTestSelector('completed-pomodori-field')).text()).toBe('1') // 2025-04-10 10:30 - 2025-04-11 10:29
    expect(newRows[2].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-09 10:30 - 2025-04-10 10:29
    expect(newRows[3].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-08 10:30 - 2025-04-09 10:29
    expect(newRows[4].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-07 10:30 - 2025-04-08 10:29
    expect(newRows[5].find(dataTestSelector('completed-pomodori-field')).text()).toBe('2') // 2025-04-06 10:30 - 2025-04-07 10:29
    expect(newRows[6].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0') // 2025-04-05 10:30 - 2025-04-06 10:29
  })

  it('should reload statistics after completed a pomodoro', async () => {
    const { wrapper, scheduler, timer } = await mountStatisticsPage({
      dailyResetTime: new Time(9, 30),
      timerConfig: TimerConfig.newTestInstance({
        focusDuration: new Duration({ seconds: 1 })
      }),
      currentDate: new Date(2025, 3, 4, 10, 30)
    })
    timer.start()

    let rows = wrapper.find('tbody').findAll('tr')
    expect(rows[0].find(dataTestSelector('completed-pomodori-field')).text()).toBe('0')

    scheduler.advanceTime(1001)
    await flushPromises()

    rows = wrapper.find('tbody').findAll('tr')
    expect(rows[0].find(dataTestSelector('completed-pomodori-field')).text()).toBe('1')
  })
})

async function mountStatisticsPage({
  timerConfig = TimerConfig.newTestInstance(),
  dailyResetTime = new Time(15, 30),
  focusSessionRecords = [newFocusSessionRecord()],
  currentDate = new Date()
} = {}) {
  const dailyResetTimeStorageService = DailyResetTimeStorageService.createFake()
  await dailyResetTimeStorageService.save(dailyResetTime)

  const currentDateService = CurrentDateService.createFake(currentDate)
  const { scheduler, timer, communicationManager, listener, focusSessionRecordStorageService } =
    await setUpListener({
      timerConfig,
      currentDateService
    })

  await focusSessionRecordStorageService.saveAll(focusSessionRecords)

  await listener.start()

  const reloadService = new FakeActionService()
  const wrapper = mount(StatisticsPage, {
    props: {
      dailyResetTimeStorageService,
      reloadService,
      currentDateService,
      focusSessionRecordStorageService,
      port: communicationManager.clientConnect()
    }
  })
  await flushPromises()
  return { wrapper, scheduler, timer, dailyResetTimeStorageService, reloadService }
}

async function saveTime(wrapper: VueWrapper, newTime: string) {
  const timerInput = wrapper.find(dataTestSelector('time-input'))
  timerInput.setValue(newTime)

  const saveButton = wrapper.find(dataTestSelector('save-button'))
  saveButton.trigger('click')
  await flushPromises()
}
