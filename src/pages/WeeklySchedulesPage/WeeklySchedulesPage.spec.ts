import { describe, expect, it, vi } from 'vitest'
import { WeeklyScheduleStorageService } from '../../domain/schedules/storage'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'

import WeeklySchedulesPage from './index.vue'
import { Weekday, WeeklySchedule } from '../../domain/schedules'
import { Time } from '../../domain/time'
import { FakeBrowsingControlService } from '../../domain/browsing_control'
import { BrowsingRulesStorageService } from '../../domain/browsing_rules/storage'
import { BrowsingRules } from '../../domain/browsing_rules'
import { afterEach, beforeEach } from 'node:test'
import { BrowsingControlTogglingService } from '../../domain/browsing_control_toggling'
import { startBackgroundListener } from '../../test_utils/listener'

describe('WeeklySchedulesPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render weekday checkboxes properly', () => {
    // Add this test because it is easy to make mistake when dealing with Weekday enum

    const { wrapper } = mountWeeklySchedulesPage()
    const weekdayCheckboxes = wrapper.findAll("[data-test^='check-weekday-']")
    expect(weekdayCheckboxes).toHaveLength(7)

    const weekdayCheckboxLabels = wrapper.findAll("[data-test='weekday-label']")
    expect(weekdayCheckboxLabels).toHaveLength(7)
    expect(weekdayCheckboxLabels[0].text()).toBe('Sun')
    expect(weekdayCheckboxLabels[1].text()).toBe('Mon')
    expect(weekdayCheckboxLabels[2].text()).toBe('Tue')
    expect(weekdayCheckboxLabels[3].text()).toBe('Wed')
    expect(weekdayCheckboxLabels[4].text()).toBe('Thu')
    expect(weekdayCheckboxLabels[5].text()).toBe('Fri')
    expect(weekdayCheckboxLabels[6].text()).toBe('Sat')
  })

  it('should render weekly schedules', async () => {
    const weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake()
    weeklyScheduleStorageService.saveAll([
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
        startTime: new Time(7, 0),
        endTime: new Time(9, 1)
      }),
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.WED]),
        startTime: new Time(6, 2),
        endTime: new Time(8, 4)
      })
    ])

    const { wrapper } = mountWeeklySchedulesPage({
      weeklyScheduleStorageService
    })
    await flushPromises()

    assertSchedulesDisplayed(wrapper, [
      {
        displayedWeekdays: 'Mon, Tue',
        displayedTime: '07:00 - 09:01'
      },
      {
        displayedWeekdays: 'Wed',
        displayedTime: '06:02 - 08:04'
      }
    ])
  })

  it('should able to add new weekly schedule', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesPage()
    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.THU, Weekday.FRI]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    await addWeeklySchedule(wrapper, weeklySchedule)

    assertSchedulesDisplayed(wrapper, [
      {
        displayedWeekdays: 'Thu, Fri',
        displayedTime: '10:00 - 12:00'
      }
    ])

    expect(await weeklyScheduleStorageService.getAll()).toEqual([weeklySchedule])

    const extraWeeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.SAT]),
      startTime: new Time(8, 0),
      endTime: new Time(10, 0)
    })
    await addWeeklySchedule(wrapper, extraWeeklySchedule)

    assertSchedulesDisplayed(wrapper, [
      {
        displayedWeekdays: 'Thu, Fri',
        displayedTime: '10:00 - 12:00'
      },
      {
        displayedWeekdays: 'Sat',
        displayedTime: '08:00 - 10:00'
      }
    ])

    expect(await weeklyScheduleStorageService.getAll()).toEqual([
      weeklySchedule,
      extraWeeklySchedule
    ])
  })

  it('should reset input values after adding weekly schedule', async () => {
    const { wrapper } = mountWeeklySchedulesPage()

    assertAllInputsAreNotSet(wrapper)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: { hour: 10, minute: 0 },
      endTime: { hour: 12, minute: 0 }
    })

    assertAllInputsAreNotSet(wrapper)
  })

  it('should prevent add weekly schedule when weekdaySet is not selected', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesPage()
    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set(),
      startTime: { hour: 10, minute: 0 },
      endTime: { hour: 12, minute: 0 }
    })

    expect(await weeklyScheduleStorageService.getAll()).toEqual([])
    expect(wrapper.find("[data-test='error-message']").text()).toContain('Please select weekdays')
  })

  it('should able to uncheck weekday', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesPage()
    const sundayCheckbox = wrapper.find(`[data-test='check-weekday-sun']`)
    await sundayCheckbox.setValue(true)
    await sundayCheckbox.setValue(false)

    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    await addWeeklySchedule(wrapper, weeklySchedule)

    expect(await weeklyScheduleStorageService.getAll()).toEqual([weeklySchedule])
  })

  it('should display error message if start time is not before end time', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesPage()

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(9, 0)
    })

    expect(await weeklyScheduleStorageService.getAll()).toEqual([])
    expect(wrapper.find("[data-test='error-message']").text()).toContain(
      'Start time must be before end time'
    )
  })

  it('should error message display and hide properly', async () => {
    const { wrapper } = mountWeeklySchedulesPage()

    expect(wrapper.find("[data-test='error-message']").exists()).toBe(false)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(9, 0)
    })

    expect(wrapper.find("[data-test='error-message']").exists()).toBe(true)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(9, 0),
      endTime: new Time(10, 0)
    })

    expect(wrapper.find("[data-test='error-message']").exists()).toBe(false)
  })

  it('should able to remove added schedule', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesPage()
    const originalSchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })

    await addWeeklySchedule(wrapper, originalSchedule)
    await addWeeklySchedule(
      wrapper,
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.TUE]),
        startTime: new Time(10, 0),
        endTime: new Time(12, 0)
      })
    )

    const removeButton = wrapper.find(`[data-test='remove-schedule-with-index-1']`)
    await removeButton.trigger('click')
    await flushPromises()

    assertSchedulesDisplayed(wrapper, [
      {
        displayedWeekdays: 'Mon',
        displayedTime: '10:00 - 12:00'
      }
    ])
    expect(await weeklyScheduleStorageService.getAll()).toEqual([originalSchedule])
  })

  it('should add or remove schedule affect the activated redirect', async () => {
    vi.setSystemTime(new Date('2025-02-03T11:00:00')) // 2025-02-03 is Monday

    const browsingRulesStorageService = BrowsingRulesStorageService.createFake()
    await browsingRulesStorageService.save(new BrowsingRules({ blockedDomains: ['google.com'] }))
    const { wrapper, fakeBrowsingControlService } = mountWeeklySchedulesPage({
      browsingRulesStorageService
    })

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 12, minute: 0 }
    })
    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.TUE]),
      startTime: { hour: 10, minute: 30 },
      endTime: { hour: 12, minute: 0 }
    })

    expect(fakeBrowsingControlService.getActivatedBrowsingRules()).toEqual(
      new BrowsingRules({ blockedDomains: ['google.com'] })
    )

    const removeButton = wrapper.find(`[data-test='remove-schedule-with-index-0']`) // Remove Monday
    await removeButton.trigger('click')
    await flushPromises()

    await expect(fakeBrowsingControlService.getActivatedBrowsingRules()).toBeNull()
  })
})

function mountWeeklySchedulesPage({
  weeklyScheduleStorageService = WeeklyScheduleStorageService.createFake(),
  browsingRulesStorageService = BrowsingRulesStorageService.createFake()
} = {}) {
  const fakeBrowsingControlService = new FakeBrowsingControlService()

  const redirectTogglingService = BrowsingControlTogglingService.createFake({
    browsingRulesStorageService,
    weeklyScheduleStorageService,
    browsingControlService: fakeBrowsingControlService
  })
  const { communicationManager } = startBackgroundListener({
    redirectTogglingService
  })
  const wrapper = mount(WeeklySchedulesPage, {
    props: { weeklyScheduleStorageService, port: communicationManager.clientConnect() }
  })
  return {
    wrapper,
    weeklyScheduleStorageService,
    fakeBrowsingControlService
  }
}

async function addWeeklySchedule(
  wrapper: VueWrapper,
  weeklyScheduleInput: {
    weekdaySet: ReadonlySet<Weekday>
    startTime: { hour: number; minute: number }
    endTime: { hour: number; minute: number }
  }
) {
  for (const weekday of weeklyScheduleInput.weekdaySet) {
    const weekdayCheckbox = wrapper.find(
      `[data-test='check-weekday-${Weekday[weekday].toLowerCase()}']`
    )
    await weekdayCheckbox.setValue(true)
  }

  const startTimeHourInput = wrapper.find("[data-test='start-time-hour-input']")
  await startTimeHourInput.setValue(weeklyScheduleInput.startTime.hour)

  const startTimeMinuteInput = wrapper.find("[data-test='start-time-minute-input']")
  await startTimeMinuteInput.setValue(weeklyScheduleInput.startTime.minute)

  const endTimeHourInput = wrapper.find("[data-test='end-time-hour-input']")
  await endTimeHourInput.setValue(weeklyScheduleInput.endTime.hour)

  const endTimeMinuteInput = wrapper.find("[data-test='end-time-minute-input']")
  await endTimeMinuteInput.setValue(weeklyScheduleInput.endTime.minute)

  const addButton = wrapper.find("[data-test='add-button']")
  await addButton.trigger('click')
  await flushPromises()
}

function assertAllInputsAreNotSet(wrapper: VueWrapper) {
  const startTimeHourInputElement = wrapper.find("[data-test='start-time-hour-input']")
    .element as HTMLInputElement
  const startTimeMinuteInputElement = wrapper.find("[data-test='start-time-minute-input']")
    .element as HTMLInputElement
  const endTimeHourInputElement = wrapper.find("[data-test='end-time-hour-input']")
    .element as HTMLInputElement
  const endTimeMinuteInputElement = wrapper.find("[data-test='end-time-minute-input']")
    .element as HTMLInputElement

  expect(startTimeHourInputElement.value).toBe('0')
  expect(startTimeMinuteInputElement.value).toBe('0')
  expect(endTimeHourInputElement.value).toBe('0')
  expect(endTimeMinuteInputElement.value).toBe('0')

  const weekdayCheckboxes = wrapper.findAll("[data-test^='check-weekday-']")
  for (const weekdayCheckbox of weekdayCheckboxes) {
    const weekdayCheckboxElement = weekdayCheckbox.element as HTMLInputElement
    expect(weekdayCheckboxElement.checked).toBe(false)
  }
}

function assertSchedulesDisplayed(
  wrapper: VueWrapper,
  expected: {
    displayedWeekdays: string
    displayedTime: string
  }[]
) {
  const weeklySchedules = wrapper.findAll("[data-test='weekly-schedule']")
  expect(weeklySchedules).toHaveLength(expected.length)

  for (let i = 0; i < expected.length; i++) {
    const { displayedWeekdays, displayedTime } = expected[i]
    expect(weeklySchedules[i].text()).toContain(displayedWeekdays)
    expect(weeklySchedules[i].text()).toContain(displayedTime)
  }
}
