import { describe, expect, it } from 'vitest'
import { Weekday, WeeklySchedule } from '..'
import { Time } from '../time'

describe('WeeklySchedules', () => {
  it('should reject empty weekday set', () => {
    expect(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set(),
          startTime: new Time(0, 0),
          endTime: new Time(0, 0)
        })
    ).toThrow('Empty weekday set')
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
