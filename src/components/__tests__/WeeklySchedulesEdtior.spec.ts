import { describe, expect, it } from 'vitest'
import {
  WeeklyScheduleStorageServiceImpl,
  type WeeklyScheduleStorageService
} from '../../domain/schedules/storage'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'

import WeeklySchedulesEditor from '../WeeklySchedulesEditor.vue'
import { Weekday, WeeklySchedule } from '../../domain/schedules'
import { Time } from '../../domain/schedules/time'

describe('WeeklySchedulesEditor', () => {
  it('should render weekday checkboxes properly', () => {
    const { wrapper } = mountWeeklySchedulesEditor()
    const weekdayCheckboxes = wrapper.findAll("[data-test^='check-weekday-']") // Add this test because it is easy to make mistake which render extra checkboxes when dealing with Weekday enum
    expect(weekdayCheckboxes).toHaveLength(7)
  })

  it('should render weekly schedules', async () => {
    const weeklyScheduleStorageService = WeeklyScheduleStorageServiceImpl.createFake()
    weeklyScheduleStorageService.saveAll([
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.Mon, Weekday.Tue]),
        startTime: new Time(7, 0),
        endTime: new Time(9, 1)
      }),
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.Wed]),
        startTime: new Time(6, 2),
        endTime: new Time(8, 4)
      })
    ])

    const { wrapper } = mountWeeklySchedulesEditor({
      weeklyScheduleStorageService
    })
    await flushPromises()

    const weeklySchedules = wrapper.findAll("[data-test='weekly-schedule']")
    expect(weeklySchedules).toHaveLength(2)

    expect(weeklySchedules[0].text()).toContain('Mon')
    expect(weeklySchedules[0].text()).toContain('Tue')
    expect(weeklySchedules[0].text()).toContain('07:00 - 09:01')

    expect(weeklySchedules[1].text()).toContain('Wed')
    expect(weeklySchedules[1].text()).toContain('06:02 - 08:04')
  })

  it('should able to add new weekly schedule', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesEditor()
    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.Thu, Weekday.Fri]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    await addWeeklySchedule(wrapper, weeklySchedule)

    let weeklySchedules = wrapper.findAll("[data-test='weekly-schedule']")
    expect(weeklySchedules).toHaveLength(1)

    expect(weeklySchedules[0].text()).toContain('Thu')
    expect(weeklySchedules[0].text()).toContain('Fri')
    expect(weeklySchedules[0].text()).toContain('10:00 - 12:00')

    expect(await weeklyScheduleStorageService.getAll()).toEqual([weeklySchedule])

    const extraWeeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.Sat]),
      startTime: new Time(8, 0),
      endTime: new Time(10, 0)
    })
    await addWeeklySchedule(wrapper, extraWeeklySchedule)

    weeklySchedules = wrapper.findAll("[data-test='weekly-schedule']")
    expect(weeklySchedules).toHaveLength(2)

    expect(weeklySchedules[0].text()).toContain('Thu')
    expect(weeklySchedules[0].text()).toContain('Fri')
    expect(weeklySchedules[0].text()).toContain('10:00 - 12:00')

    expect(weeklySchedules[1].text()).toContain('Sat')
    expect(weeklySchedules[1].text()).toContain('08:00 - 10:00')

    expect(await weeklyScheduleStorageService.getAll()).toEqual([
      weeklySchedule,
      extraWeeklySchedule
    ])
  })

  it('should reset input values after adding weekly schedule', async () => {
    const { wrapper } = mountWeeklySchedulesEditor()

    assertAllInputsAreNotSet(wrapper)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.Mon]),
      startTime: { hour: 10, minute: 0 },
      endTime: { hour: 12, minute: 0 }
    })

    assertAllInputsAreNotSet(wrapper)
  })

  it('should prevent add weekly schedule when weekdaySet is not selected', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesEditor()
    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set(),
      startTime: { hour: 10, minute: 0 },
      endTime: { hour: 12, minute: 0 }
    })

    expect(await weeklyScheduleStorageService.getAll()).toEqual([])
    expect(wrapper.find("[data-test='error-message']").text()).toContain('Please select weekdays')
  })

  it('should able to uncheck weekday', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesEditor()
    const sundayCheckbox = wrapper.find(`[data-test='check-weekday-${Weekday[Weekday.Sun]}']`)
    await sundayCheckbox.setValue(true)
    await sundayCheckbox.setValue(false)

    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.Mon]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    await addWeeklySchedule(wrapper, weeklySchedule)

    expect(await weeklyScheduleStorageService.getAll()).toEqual([weeklySchedule])
  })

  it('should display error message if start time is not before end time', async () => {
    const { wrapper, weeklyScheduleStorageService } = mountWeeklySchedulesEditor()

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.Mon]),
      startTime: new Time(10, 0),
      endTime: new Time(9, 0)
    })

    expect(await weeklyScheduleStorageService.getAll()).toEqual([])
    expect(wrapper.find("[data-test='error-message']").text()).toContain(
      'Start time must be before end time'
    )
  })

  it('should error message display and hide properly', async () => {
    const { wrapper } = mountWeeklySchedulesEditor()

    expect(wrapper.find("[data-test='error-message']").exists()).toBe(false)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.Mon]),
      startTime: new Time(10, 0),
      endTime: new Time(9, 0)
    })

    expect(wrapper.find("[data-test='error-message']").exists()).toBe(true)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.Mon]),
      startTime: new Time(9, 0),
      endTime: new Time(10, 0)
    })

    expect(wrapper.find("[data-test='error-message']").exists()).toBe(false)
  })
})

function mountWeeklySchedulesEditor({
  weeklyScheduleStorageService = WeeklyScheduleStorageServiceImpl.createFake()
}: {
  weeklyScheduleStorageService?: WeeklyScheduleStorageService
} = {}) {
  const wrapper = mount(WeeklySchedulesEditor, {
    props: { weeklyScheduleStorageService }
  })
  return {
    wrapper,
    weeklyScheduleStorageService
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
    const weekdayCheckbox = wrapper.find(`[data-test='check-weekday-${Weekday[weekday]}']`)
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
