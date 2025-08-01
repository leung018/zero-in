import { VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { BrowsingRules } from '@/domain/browsing_rules'
import { Weekday, WeeklySchedule } from '@/domain/schedules'
import { Time } from '@/domain/time'
import { setUpListener } from '@/test_utils/listener'
import { assertCheckboxValue, assertSelectorInputValue } from '../../../test_utils/assert'
import { dataTestSelector } from '../../../test_utils/selector'
import WeeklySchedulesEditor from './index.vue'

describe('WeeklySchedulesEditor', () => {
  it('should render weekday checkboxes properly', async () => {
    // Add this test because it is easy to make mistake when dealing with Weekday enum

    const { wrapper } = await mountWeeklySchedulesEditor()
    const weekdayCheckboxes = wrapper.findAll("[data-test^='check-weekday-']")
    expect(weekdayCheckboxes).toHaveLength(7)

    const weekdayCheckboxLabels = wrapper.findAll(dataTestSelector('weekday-label'))
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
    const { wrapper } = await mountWeeklySchedulesEditor({
      weeklySchedules: [
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
          startTime: new Time(7, 0),
          endTime: new Time(9, 1),
          targetFocusSessions: 1
        }),
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.WED]),
          startTime: new Time(6, 2),
          endTime: new Time(8, 4)
        })
      ]
    })

    assertSchedulesDisplayed(wrapper, [
      {
        displayedWeekdays: 'Mon, Tue',
        displayedTime: '07:00 - 09:01',
        displayedTargetFocusSessions: 1
      },
      {
        displayedWeekdays: 'Wed',
        displayedTime: '06:02 - 08:04'
      }
    ])
  })

  it('should hide saved schedules section when no schedule', async () => {
    const { wrapper } = await mountWeeklySchedulesEditor({
      weeklySchedules: []
    })
    expect(wrapper.find(dataTestSelector('saved-schedules-section')).exists()).toBe(false)

    await addWeeklySchedule(wrapper)

    expect(wrapper.find(dataTestSelector('saved-schedules-section')).exists()).toBe(true)
  })

  it('should able to add new weekly schedule', async () => {
    const { wrapper, weeklyScheduleStorageService } = await mountWeeklySchedulesEditor({
      weeklySchedules: []
    })
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
      endTime: new Time(10, 0),
      targetFocusSessions: 2
    })
    await addWeeklySchedule(wrapper, extraWeeklySchedule)

    assertSchedulesDisplayed(wrapper, [
      {
        displayedWeekdays: 'Thu, Fri',
        displayedTime: '10:00 - 12:00'
      },
      {
        displayedWeekdays: 'Sat',
        displayedTime: '08:00 - 10:00',
        displayedTargetFocusSessions: 2
      }
    ])

    expect(await weeklyScheduleStorageService.getAll()).toEqual([
      weeklySchedule,
      extraWeeklySchedule
    ])
  })

  it('should reset input values after adding weekly schedule', async () => {
    const { wrapper } = await mountWeeklySchedulesEditor()

    assertAllInputsAreNotSet(wrapper)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0),
      targetFocusSessions: 5
    })

    assertAllInputsAreNotSet(wrapper)
  })

  it('should prevent add weekly schedule when weekdaySet is not selected', async () => {
    const { wrapper, weeklyScheduleStorageService } = await mountWeeklySchedulesEditor({
      weeklySchedules: []
    })
    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set(),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })

    expect(await weeklyScheduleStorageService.getAll()).toEqual([])
    expect(wrapper.find(dataTestSelector('error-message')).text()).toContain(
      'Please select weekdays'
    )
  })

  it('should able to uncheck weekday', async () => {
    const { wrapper, weeklyScheduleStorageService } = await mountWeeklySchedulesEditor({
      weeklySchedules: []
    })
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
    const { wrapper, weeklyScheduleStorageService } = await mountWeeklySchedulesEditor({
      weeklySchedules: []
    })

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(9, 0)
    })

    expect(await weeklyScheduleStorageService.getAll()).toEqual([])
    expect(wrapper.find(dataTestSelector('error-message')).text()).toContain(
      'Start time must be before end time'
    )
  })

  it('should error message display and hide properly', async () => {
    const { wrapper } = await mountWeeklySchedulesEditor()

    expect(wrapper.find(dataTestSelector('error-message')).exists()).toBe(false)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(9, 0)
    })

    expect(wrapper.find(dataTestSelector('error-message')).exists()).toBe(true)

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(9, 0),
      endTime: new Time(10, 0)
    })

    expect(wrapper.find(dataTestSelector('error-message')).exists()).toBe(false)
  })

  it('should able to remove added schedule', async () => {
    const originalSchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    const { wrapper, weeklyScheduleStorageService } = await mountWeeklySchedulesEditor({
      weeklySchedules: [
        originalSchedule,
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.TUE]),
          startTime: new Time(10, 0),
          endTime: new Time(12, 0)
        })
      ]
    })

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
    const { wrapper, browsingControlService } = await mountWeeklySchedulesEditor({
      browsingRules: new BrowsingRules({ blockedDomains: ['google.com'] }),
      weeklySchedules: [
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.TUE]),
          startTime: new Time(10, 30),
          endTime: new Time(12, 0)
        })
      ],
      currentDate: new Date('2025-02-03T11:00:00') // 2025-02-03 is Monday
    })

    expect(await browsingControlService.getActivatedBrowsingRules()).toBeNull()

    await addWeeklySchedule(wrapper, {
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 30),
      endTime: new Time(12, 0)
    })

    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(
      new BrowsingRules({ blockedDomains: ['google.com'] })
    )

    const removeButton = wrapper.find(`[data-test='remove-schedule-with-index-1']`) // Remove Monday
    await removeButton.trigger('click')
    await flushPromises()

    await expect(browsingControlService.getActivatedBrowsingRules()).toBeNull()
  })
})

async function mountWeeklySchedulesEditor({
  browsingRules = new BrowsingRules({ blockedDomains: ['example.com'] }),
  weeklySchedules = [
    new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
  ],
  currentDate = new Date()
} = {}) {
  const {
    communicationManager,
    listener,
    weeklyScheduleStorageService,
    browsingRulesStorageService,
    browsingControlService
  } = await setUpListener({
    stubbedDate: currentDate
  })

  await weeklyScheduleStorageService.saveAll(weeklySchedules)
  await browsingRulesStorageService.save(browsingRules)

  await listener.start()

  const wrapper = mount(WeeklySchedulesEditor, {
    props: { weeklyScheduleStorageService, port: communicationManager.clientConnect() }
  })
  await flushPromises()
  return {
    wrapper,
    weeklyScheduleStorageService,
    browsingControlService
  }
}

async function addWeeklySchedule(
  wrapper: VueWrapper,
  weeklyScheduleInput: {
    weekdaySet: ReadonlySet<Weekday>
    startTime: Time
    endTime: Time
    targetFocusSessions?: number
  } = {
    weekdaySet: new Set([Weekday.MON]),
    startTime: new Time(10, 0),
    endTime: new Time(12, 0)
  }
) {
  for (const weekday of weeklyScheduleInput.weekdaySet) {
    const weekdayCheckbox = wrapper.find(
      `[data-test='check-weekday-${Weekday[weekday].toLowerCase()}']`
    )
    await weekdayCheckbox.setValue(true)
  }

  const { startTime, endTime } = weeklyScheduleInput

  const startTimeInput = wrapper.find(dataTestSelector('start-time-input'))
  startTimeInput.setValue(startTime.toHhMmString())

  const endTimeInput = wrapper.find(dataTestSelector('end-time-input'))
  endTimeInput.setValue(endTime.toHhMmString())

  if (weeklyScheduleInput.targetFocusSessions) {
    const targetFocusSessionsInput = wrapper.find(dataTestSelector('target-focus-sessions-input'))
    targetFocusSessionsInput.setValue(weeklyScheduleInput.targetFocusSessions)
  }

  const addButton = wrapper.find(dataTestSelector('add-schedule-button'))
  await addButton.trigger('click')
  await flushPromises()
}

function assertAllInputsAreNotSet(wrapper: VueWrapper) {
  assertSelectorInputValue(wrapper, dataTestSelector('start-time-input'), '00:00')
  assertSelectorInputValue(wrapper, dataTestSelector('end-time-input'), '00:00')
  assertSelectorInputValue(wrapper, dataTestSelector('target-focus-sessions-input'), '')

  const weekdayCheckboxes = wrapper.findAll("[data-test^='check-weekday-']")
  for (const weekdayCheckbox of weekdayCheckboxes) {
    assertCheckboxValue(weekdayCheckbox, false)
  }
}

function assertSchedulesDisplayed(
  wrapper: VueWrapper,
  expected: {
    displayedWeekdays: string
    displayedTime: string
    displayedTargetFocusSessions?: number
  }[]
) {
  const weeklySchedules = wrapper.findAll(dataTestSelector('weekly-schedule'))
  expect(weeklySchedules).toHaveLength(expected.length)

  for (let i = 0; i < expected.length; i++) {
    const { displayedWeekdays, displayedTime } = expected[i]
    expect(weeklySchedules[i].text()).toContain(displayedWeekdays)
    expect(weeklySchedules[i].text()).toContain(displayedTime)

    // Check displayed target focus sessions
    const displayedTargetFocusSessions = expected[i].displayedTargetFocusSessions
    if (displayedTargetFocusSessions) {
      const badge = weeklySchedules[i].find(dataTestSelector('target-focus-sessions'))
      expect(badge.exists()).toBe(true)
      const badgeValue = badge.text().match(/\d+/)?.[0]
      expect(badgeValue).toBe(displayedTargetFocusSessions.toString())
    } else {
      expect(weeklySchedules[i].find(dataTestSelector('target-focus-sessions')).exists()).toBe(
        false
      )
    }
  }
}
