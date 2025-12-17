import { fireEvent, render, RenderAPI, waitFor, within } from '@testing-library/react-native'
import { WeeklySchedule } from '@zero-in/shared/domain/schedules'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { Weekday } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time'
import { WeeklySchedulesEditor } from './WeeklySchedulesEditor'

describe('WeeklySchedulesEditor', () => {
  it('should render weekday checkboxes properly', async () => {
    const { wrapper } = await renderWeeklySchedulesEditor()

    const showAddScheduleButton = wrapper.getByTestId('show-add-schedule-button')
    fireEvent.press(showAddScheduleButton)

    const weekdayCheckboxLabels = wrapper.getAllByTestId('weekday-label')
    expect(weekdayCheckboxLabels).toHaveLength(7)
    expect(getTextContent(weekdayCheckboxLabels[0])).toBe('Sun')
    expect(getTextContent(weekdayCheckboxLabels[1])).toBe('Mon')
    expect(getTextContent(weekdayCheckboxLabels[2])).toBe('Tue')
    expect(getTextContent(weekdayCheckboxLabels[3])).toBe('Wed')
    expect(getTextContent(weekdayCheckboxLabels[4])).toBe('Thu')
    expect(getTextContent(weekdayCheckboxLabels[5])).toBe('Fri')
    expect(getTextContent(weekdayCheckboxLabels[6])).toBe('Sat')
  })
  it('should render weekly schedules', async () => {
    const { wrapper } = await renderWeeklySchedulesEditor({
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

    await assertSchedulesDisplayed(wrapper, [
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

  it('should hide active schedules section when no schedule', async () => {
    const { wrapper } = await renderWeeklySchedulesEditor({
      weeklySchedules: []
    })
    expect(wrapper.queryByTestId('active-schedules-section')).toBeNull()

    await addWeeklySchedule(wrapper)

    expect(wrapper.queryByTestId('active-schedules-section')).toBeTruthy()
  })

  it('should able to add new weekly schedule', async () => {
    const { wrapper, weeklySchedulesStorageService } = await renderWeeklySchedulesEditor({
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

    expect(await weeklySchedulesStorageService.get()).toEqual([weeklySchedule])

    const extraWeeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.SAT]),
      startTime: new Time(8, 0),
      endTime: new Time(10, 0),
      targetFocusSessions: 2
    })
    await addWeeklySchedule(wrapper, extraWeeklySchedule)

    await assertSchedulesDisplayed(wrapper, [
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

    expect(await weeklySchedulesStorageService.get()).toEqual([weeklySchedule, extraWeeklySchedule])
  })

  it('should able to remove added schedule', async () => {
    const originalSchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    const { wrapper, weeklySchedulesStorageService } = await renderWeeklySchedulesEditor({
      weeklySchedules: [
        originalSchedule,
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.TUE]),
          startTime: new Time(10, 0),
          endTime: new Time(12, 0)
        })
      ]
    })

    // Wait for schedules to be loaded and rendered
    await waitFor(() => {
      expect(wrapper.getAllByTestId('weekly-schedule')).toHaveLength(2)
    })

    const removeButton = wrapper.getByTestId('remove-schedule-with-index-1')
    fireEvent.press(removeButton)

    await assertSchedulesDisplayed(wrapper, [
      {
        displayedWeekdays: 'Mon',
        displayedTime: '10:00 - 12:00'
      }
    ])

    expect(await weeklySchedulesStorageService.get()).toEqual([originalSchedule])
  })

  it('should prevent add weekly schedule when weekdaySet is not selected', async () => {
    const { wrapper, weeklySchedulesStorageService } = await renderWeeklySchedulesEditor({
      weeklySchedules: []
    })

    await addWeeklySchedule(
      wrapper,
      {
        weekdaySet: new Set(),
        startTime: new Time(10, 0),
        endTime: new Time(12, 0)
      },
      { waitForFormHidden: false }
    )

    await wrapper.findByText('Please select at least one weekday')

    expect(await weeklySchedulesStorageService.get()).toEqual([])
  })

  it('should able to uncheck weekday', async () => {
    const { wrapper, weeklySchedulesStorageService } = await renderWeeklySchedulesEditor({
      weeklySchedules: []
    })

    // Show the form
    const showAddScheduleButton = wrapper.getByTestId('show-add-schedule-button')
    fireEvent.press(showAddScheduleButton)

    // Check Sunday
    const sundayCheckbox = wrapper.getByTestId('check-weekday-sun')
    fireEvent.press(sundayCheckbox)

    // Uncheck Sunday
    fireEvent.press(sundayCheckbox)

    // Add schedule with only Monday selected
    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    await addWeeklySchedule(wrapper, weeklySchedule, {
      waitForFormHidden: true,
      clickShowAddScheduleButton: false
    })

    expect(await weeklySchedulesStorageService.get()).toEqual([weeklySchedule])
  })

  it('should display error message if start time is not before end time', async () => {
    const { wrapper, weeklySchedulesStorageService } = await renderWeeklySchedulesEditor({
      weeklySchedules: []
    })

    await addWeeklySchedule(
      wrapper,
      {
        weekdaySet: new Set([Weekday.MON]),
        startTime: new Time(10, 0),
        endTime: new Time(9, 0)
      },
      { waitForFormHidden: false }
    )

    expect(wrapper.getByText('Start time must be before end time')).toBeTruthy()
    expect(await weeklySchedulesStorageService.get()).toEqual([])
  })

  it('should error message display and hide properly', async () => {
    const { wrapper } = await renderWeeklySchedulesEditor()

    const showAddScheduleButton = wrapper.getByTestId('show-add-schedule-button')
    fireEvent.press(showAddScheduleButton)

    expect(wrapper.queryByTestId('error-message')).toBeNull()

    await addWeeklySchedule(
      wrapper,
      {
        weekdaySet: new Set([Weekday.MON]),
        startTime: new Time(10, 0),
        endTime: new Time(9, 0)
      },
      { waitForFormHidden: false, clickShowAddScheduleButton: false }
    )

    await wrapper.findByTestId('error-message')

    await addWeeklySchedule(
      wrapper,
      {
        weekdaySet: new Set([Weekday.TUE]),
        startTime: new Time(9, 0),
        endTime: new Time(10, 0)
      },
      { waitForFormHidden: true, clickShowAddScheduleButton: false }
    )

    fireEvent.press(showAddScheduleButton)

    expect(wrapper.queryByTestId('error-message')).toBeNull()
  })
})

async function renderWeeklySchedulesEditor({
  weeklySchedules = [
    new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
  ]
}: {
  weeklySchedules?: WeeklySchedule[]
} = {}) {
  const weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake()
  await weeklySchedulesStorageService.save(weeklySchedules)
  const wrapper = render(
    <WeeklySchedulesEditor weeklySchedulesStorageService={weeklySchedulesStorageService} />
  )

  // If schedules are provided, wait for them to be rendered
  if (weeklySchedules.length > 0) {
    await waitFor(() => {
      const renderedSchedules = wrapper.getAllByTestId('weekly-schedule')
      expect(renderedSchedules).toHaveLength(weeklySchedules.length)
    })
  }

  return { wrapper, weeklySchedulesStorageService }
}

async function assertSchedulesDisplayed(
  wrapper: RenderAPI,
  expected: {
    displayedWeekdays: string
    displayedTime: string
    displayedTargetFocusSessions?: number
  }[]
) {
  await waitFor(() => {
    const weeklySchedules = wrapper.getAllByTestId('weekly-schedule')
    expect(weeklySchedules).toHaveLength(expected.length)

    for (let i = 0; i < expected.length; i++) {
      const { displayedWeekdays, displayedTime, displayedTargetFocusSessions } = expected[i]
      const scheduleElement = weeklySchedules[i]
      const scheduleWithin = within(scheduleElement)

      // Check weekdays
      scheduleWithin.getByText(displayedWeekdays)

      // Check time
      scheduleWithin.getByText(displayedTime)

      // Check displayed target focus sessions
      if (displayedTargetFocusSessions) {
        const badge = scheduleWithin.getByTestId('target-focus-sessions')
        const badgeText = getTextContent(badge)
        const badgeValue = badgeText.match(/\d+/)?.[0]
        expect(badgeValue).toBe(displayedTargetFocusSessions.toString())
      } else {
        expect(scheduleWithin.queryByTestId('target-focus-sessions')).toBeNull()
      }
    }
  })
}

async function setTimePickerValue(
  wrapper: RenderAPI,
  showButtonTestId: string,
  pickerTestId: string,
  time: Time
) {
  const timeButton = wrapper.getByTestId(showButtonTestId)
  fireEvent.press(timeButton)

  const timePicker = await wrapper.findByTestId(pickerTestId)
  const date = new Date()
  date.setHours(time.hour)
  date.setMinutes(time.minute)
  date.setSeconds(0)
  date.setMilliseconds(0)
  fireEvent(timePicker, 'change', { nativeEvent: { timestamp: date.getTime() } }, date)
}

async function addWeeklySchedule(
  wrapper: RenderAPI,
  weeklyScheduleInput: {
    weekdaySet: ReadonlySet<Weekday>
    startTime: Time
    endTime: Time
    targetFocusSessions?: number | null
  } = {
    weekdaySet: new Set([Weekday.MON]),
    startTime: new Time(10, 0),
    endTime: new Time(12, 0),
    targetFocusSessions: null
  },
  options: {
    waitForFormHidden?: boolean
    clickShowAddScheduleButton?: boolean
  } = {}
) {
  const { waitForFormHidden = true, clickShowAddScheduleButton = true } = options

  // Show the form by pressing "Add Schedule" button
  if (clickShowAddScheduleButton) {
    const showAddScheduleButton = wrapper.getByTestId('show-add-schedule-button')
    fireEvent.press(showAddScheduleButton)
  }

  // Select weekdays
  for (const weekday of weeklyScheduleInput.weekdaySet) {
    const weekdayCheckbox = wrapper.getByTestId(`check-weekday-${Weekday[weekday].toLowerCase()}`)
    fireEvent.press(weekdayCheckbox)
  }

  const { startTime, endTime } = weeklyScheduleInput

  // Set start time
  await setTimePickerValue(wrapper, 'start-time-button', 'start-time-picker', startTime)

  // Set end time
  await setTimePickerValue(wrapper, 'end-time-button', 'end-time-picker', endTime)

  // Set target focus sessions if provided
  if (weeklyScheduleInput.targetFocusSessions) {
    const targetFocusSessionsInput = wrapper.getByTestId('target-focus-sessions-input')
    fireEvent.changeText(
      targetFocusSessionsInput,
      weeklyScheduleInput.targetFocusSessions.toString()
    )
  }

  // Press Add button
  const addButton = wrapper.getByTestId('add-schedule-button')
  fireEvent.press(addButton)

  // Wait for async operations and form to reset
  if (waitForFormHidden) {
    // Wait for the form to be hidden (show add schedule button should appear again)
    await wrapper.findByTestId('show-add-schedule-button')
  }
}

function getTextContent(element: any): string {
  // Extract all text content from React Native element and its children
  if (typeof element?.children === 'string') {
    return element.children
  }
  if (Array.isArray(element?.children)) {
    return element.children
      .map((child: any) => (typeof child === 'string' ? child : getTextContent(child)))
      .join('')
  }
  return ''
}
