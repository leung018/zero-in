import { describe, expect, it } from 'vitest'
import { Weekday, WeeklySchedule, WeeklyScheduleInvalidInputError } from '.'
import { Time } from './time'
import { assertToThrowError } from '../../test_utils/check_error'

describe('WeeklySchedules', () => {
  it('should reject empty weekday set', () => {
    assertToThrowError(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set(),
          startTime: new Time(0, 0),
          endTime: new Time(0, 0)
        }),
      new WeeklyScheduleInvalidInputError('weekdaySet must not be empty')
    )
  })

  it('should reject if start time is not before end time', () => {
    const err = new WeeklyScheduleInvalidInputError('startTime must be before endTime')

    assertToThrowError(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.Mon]),
          startTime: new Time(10, 0),
          endTime: new Time(9, 0)
        }),
      err
    )
    assertToThrowError(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.Mon]),
          startTime: new Time(10, 0),
          endTime: new Time(10, 0)
        }),
      err
    )
  })

  it('should accept valid input', () => {
    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.Mon]),
      startTime: new Time(11, 0),
      endTime: new Time(18, 0)
    })
    expect(weeklySchedule.weekdaySet).toEqual(new Set([Weekday.Mon]))
    expect(weeklySchedule.startTime).toEqual(new Time(11, 0))
    expect(weeklySchedule.endTime).toEqual(new Time(18, 0))
  })
})
