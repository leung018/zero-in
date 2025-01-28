import { describe, expect, it } from 'vitest'
import { Weekday, WeeklySchedule } from '.'
import { Time } from './time'

describe('WeeklySchedules', () => {
  it('should reject empty weekday set', () => {
    expect(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set(),
          startTime: new Time(0, 0),
          endTime: new Time(0, 0)
        })
    ).toThrow('weekdaySet must not be empty')
  })

  it('should reject if start time is not before end time', () => {
    const errMsg = 'startTime must be before endTime'
    expect(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.Mon]),
          startTime: new Time(10, 0),
          endTime: new Time(9, 0)
        })
    ).toThrow(errMsg)
    expect(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.Mon]),
          startTime: new Time(10, 0),
          endTime: new Time(10, 0)
        })
    ).toThrow(errMsg)
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
