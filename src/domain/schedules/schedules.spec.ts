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
          weekdaySet: new Set([Weekday.MON]),
          startTime: new Time(10, 0),
          endTime: new Time(9, 0)
        }),
      err
    )
    assertToThrowError(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.MON]),
          startTime: new Time(10, 0),
          endTime: new Time(10, 0)
        }),
      err
    )
  })

  it('should accept valid input', () => {
    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(11, 0),
      endTime: new Time(18, 0)
    })
    expect(weeklySchedule.weekdaySet).toEqual(new Set([Weekday.MON]))
    expect(weeklySchedule.startTime).toEqual(new Time(11, 0))
    expect(weeklySchedule.endTime).toEqual(new Time(18, 0))
  })

  it('should isContain check the date within the schedule according to weekdays', () => {
    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON, Weekday.TUE]),
      startTime: new Time(11, 0),
      endTime: new Time(18, 0)
    })
    expect(weeklySchedule.isContain(new Date('2025-02-03T11:00:00'))).toBe(true) // Mon
    expect(weeklySchedule.isContain(new Date('2025-02-04T11:00:00'))).toBe(true) // Tue
    expect(weeklySchedule.isContain(new Date('2025-02-05T11:00:00'))).toBe(false) // Wed
  })

  it('should isContain check the date within the schedule according to start and end time', () => {
    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(11, 0),
      endTime: new Time(18, 0)
    })

    // 2025-02-03 is Monday

    expect(weeklySchedule.isContain(new Date('2025-02-03T11:00:00'))).toBe(true)
    expect(weeklySchedule.isContain(new Date('2025-02-03T11:00:01'))).toBe(true)
    expect(weeklySchedule.isContain(new Date('2025-02-03T15:00:00'))).toBe(true)
    expect(weeklySchedule.isContain(new Date('2025-02-03T17:59:59'))).toBe(true)

    expect(weeklySchedule.isContain(new Date('2025-02-03T10:59:59'))).toBe(false)
    expect(weeklySchedule.isContain(new Date('2025-02-03T18:00:00'))).toBe(false)
    expect(weeklySchedule.isContain(new Date('2025-02-03T18:00:01'))).toBe(false)
  })
})
