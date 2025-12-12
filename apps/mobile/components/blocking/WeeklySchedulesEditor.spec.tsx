import { render, RenderAPI } from '@testing-library/react-native'
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
  return { wrapper }
}

function assertSchedulesDisplayed(
  wrapper: RenderAPI,
  expected: {
    displayedWeekdays: string
    displayedTime: string
    displayedTargetFocusSessions?: number
  }[]
) {
  const weeklySchedules = wrapper.getAllByTestId('weekly-schedule')
  expect(weeklySchedules).toHaveLength(expected.length)

  for (let i = 0; i < expected.length; i++) {
    const { displayedWeekdays, displayedTime, displayedTargetFocusSessions } = expected[i]

    // Check weekdays
    expect(weeklySchedules[i].textContent).toContain(displayedWeekdays)

    // Check time
    expect(weeklySchedules[i].textContent).toContain(displayedTime)

    // Check displayed target focus sessions
    if (displayedTargetFocusSessions) {
      const badge = wrapper.queryByTestId('target-focus-sessions')
      expect(badge).toBeTruthy()
      const badgeValue = badge.textContent?.match(/\d+/)?.[0]
      expect(badgeValue).toBe(displayedTargetFocusSessions.toString())
    } else {
      expect(wrapper.queryByTestId('target-focus-sessions')).toBeNull()
    }
  }
}
