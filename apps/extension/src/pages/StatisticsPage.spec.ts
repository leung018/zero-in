import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { Time } from '@zero-in/shared/domain/time/index'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DailyResetTimeStorageService } from '../domain/daily-reset-time/storage'
import { TimerConfig } from '../domain/timer/config'
import { newFocusSessionRecord, type FocusSessionRecord } from '../domain/timer/record'
import { FakeActionService } from '../infra/action'
import { assertSelectorInputValue } from '../test-utils/assert'
import { setUpListener } from '../test-utils/listener'
import { dataTestSelector } from '../test-utils/selector'
import StatisticsPage from './StatisticsPage.vue'

describe('StatisticsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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

  it('should trigger notifierService after clicked save', async () => {
    const { wrapper, updateSuccessNotifierService } = await mountStatisticsPage()

    expect(updateSuccessNotifierService.hasTriggered()).toBe(false)

    await saveTime(wrapper, '15:05')

    expect(updateSuccessNotifierService.hasTriggered()).toBe(true)
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
    vi.setSystemTime(new Date(2025, 3, 11, 9, 0))
    const { wrapper } = await mountStatisticsPage({
      dailyResetTime: new Time(10, 30),
      focusSessionRecords
    })

    const rows = wrapper.find('tbody').findAll('tr')
    expect(rows[0].find(dataTestSelector('completed-focus-sessions')).text()).toBe('1') // 2025-04-10 10:30 - now
    expect(rows[1].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-09 10:30 - 2025-04-10 10:29
    expect(rows[2].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-08 10:30 - 2025-04-09 10:29
    expect(rows[3].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-07 10:30 - 2025-04-08 10:29
    expect(rows[4].find(dataTestSelector('completed-focus-sessions')).text()).toBe('2') // 2025-04-06 10:30 - 2025-04-07 10:29
    expect(rows[5].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-05 10:30 - 2025-04-06 10:29
    expect(rows[6].find(dataTestSelector('completed-focus-sessions')).text()).toBe('2') // 2025-04-04 10:30 - 2025-04-05 10:29

    // When current time has reached the daily reset time that day.
    vi.setSystemTime(new Date(2025, 3, 11, 10, 30))
    const { wrapper: newWrapper } = await mountStatisticsPage({
      dailyResetTime: new Time(10, 30),
      focusSessionRecords
    })

    const newRows = newWrapper.find('tbody').findAll('tr')
    expect(newRows[0].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-11 10:30 - now
    expect(newRows[1].find(dataTestSelector('completed-focus-sessions')).text()).toBe('1') // 2025-04-10 10:30 - 2025-04-11 10:29
    expect(newRows[2].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-09 10:30 - 2025-04-10 10:29
    expect(newRows[3].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-08 10:30 - 2025-04-09 10:29
    expect(newRows[4].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-07 10:30 - 2025-04-08 10:29
    expect(newRows[5].find(dataTestSelector('completed-focus-sessions')).text()).toBe('2') // 2025-04-06 10:30 - 2025-04-07 10:29
    expect(newRows[6].find(dataTestSelector('completed-focus-sessions')).text()).toBe('0') // 2025-04-05 10:30 - 2025-04-06 10:29
  })
})

async function mountStatisticsPage({
  timerConfig = TimerConfig.newTestInstance(),
  dailyResetTime = new Time(15, 30),
  focusSessionRecords = [newFocusSessionRecord()]
} = {}) {
  const dailyResetTimeStorageService = DailyResetTimeStorageService.createFake()
  await dailyResetTimeStorageService.save(dailyResetTime)

  const { timer, listener, focusSessionRecordsStorageService } = await setUpListener({
    timerConfig
  })

  await focusSessionRecordsStorageService.save(focusSessionRecords)

  await listener.start()

  const updateSuccessNotifierService = new FakeActionService()
  const wrapper = mount(StatisticsPage, {
    props: {
      dailyResetTimeStorageService,
      updateSuccessNotifierService,
      focusSessionRecordsStorageService
    }
  })
  await flushPromises()
  return { wrapper, timer, dailyResetTimeStorageService, updateSuccessNotifierService }
}

async function saveTime(wrapper: VueWrapper, newTime: string) {
  const timerInput = wrapper.find(dataTestSelector('time-input'))
  timerInput.setValue(newTime)

  const saveButton = wrapper.find(dataTestSelector('daily-reset-time-save-button'))
  saveButton.trigger('click')
  await flushPromises()
}
