import { fireEvent, render, RenderAPI, waitFor, within } from '@testing-library/react-native'
import { Weekday, WeeklySchedule } from '@zero-in/shared/domain/schedules'
import { WeeklySchedulesStorageService } from '@zero-in/shared/domain/schedules/storage'
import { Time } from '@zero-in/shared/domain/time'
import { WeeklySchedulesEditor } from './WeeklySchedulesEditor'

describe('WeeklySchedulesEditor', () => {
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
  weeklySchedules: WeeklySchedule[]
}) {
  const weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake()
  await weeklySchedulesStorageService.save(weeklySchedules)
  const wrapper = render(
    <WeeklySchedulesEditor weeklySchedulesStorageService={weeklySchedulesStorageService} />
  )
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
  }
) {
  // Show the form by pressing "Add Schedule" button
  const showAddScheduleButton = wrapper.getByTestId('show-add-schedule-button')
  fireEvent.press(showAddScheduleButton)

  // Select weekdays
  for (const weekday of weeklyScheduleInput.weekdaySet) {
    const weekdayCheckbox = wrapper.getByTestId(`check-weekday-${Weekday[weekday].toLowerCase()}`)
    fireEvent.press(weekdayCheckbox)
  }

  const { startTime, endTime } = weeklyScheduleInput

  // Set start time
  // First, press the time picker button to show the picker
  const startTimeButton = wrapper.getByTestId('start-time-button')
  fireEvent.press(startTimeButton)

  // Wait for picker to appear, then trigger the DateTimePicker onChange
  await waitFor(() => {
    expect(wrapper.getByTestId('start-time-picker')).toBeTruthy()
  })
  const startTimePicker = wrapper.getByTestId('start-time-picker')
  const startDate = new Date()
  startDate.setHours(startTime.hour)
  startDate.setMinutes(startTime.minute)
  startDate.setSeconds(0)
  startDate.setMilliseconds(0)
  // DateTimePicker onChange receives (event, selectedDate)
  fireEvent(
    startTimePicker,
    'change',
    { nativeEvent: { timestamp: startDate.getTime() } },
    startDate
  )

  // Set end time
  // First, press the time picker button to show the picker
  const endTimeButton = wrapper.getByTestId('end-time-button')
  fireEvent.press(endTimeButton)

  // Wait for picker to appear, then trigger the DateTimePicker onChange
  await waitFor(() => {
    expect(wrapper.getByTestId('end-time-picker')).toBeTruthy()
  })
  const endTimePicker = wrapper.getByTestId('end-time-picker')
  const endDate = new Date()
  endDate.setHours(endTime.hour)
  endDate.setMinutes(endTime.minute)
  endDate.setSeconds(0)
  endDate.setMilliseconds(0)
  // DateTimePicker onChange receives (event, selectedDate)
  fireEvent(endTimePicker, 'change', { nativeEvent: { timestamp: endDate.getTime() } }, endDate)

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
  await waitFor(() => {
    // Wait for the form to be hidden (show add schedule button should appear again)
    expect(wrapper.getByTestId('show-add-schedule-button')).toBeTruthy()
  })
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
