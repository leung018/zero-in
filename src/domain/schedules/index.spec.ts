import { describe, expect, it } from 'vitest'
import { Weekday, WeeklySchedule } from '.'
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
    ).toThrow('weekdaySet must not be empty')
  })

  it('should reject if start time is not before end time', () => {
    const err = 'startTime must be before endTime'

    expect(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.MON]),
          startTime: new Time(10, 0),
          endTime: new Time(9, 0)
        })
    ).toThrow(err)

    expect(
      () =>
        new WeeklySchedule({
          weekdaySet: new Set([Weekday.MON]),
          startTime: new Time(10, 0),
          endTime: new Time(10, 0)
        })
    ).toThrow(err)
  })

  it('should accept valid input', () => {
    const weeklySchedule = new WeeklySchedule({
      weekdaySet: new Set([Weekday.MON]),
      startTime: new Time(11, 0),
      endTime: new Time(18, 0),
      targetFocusSessions: 2
    })
    expect(weeklySchedule.weekdaySet).toEqual(new Set([Weekday.MON]))
    expect(weeklySchedule.startTime).toEqual(new Time(11, 0))
    expect(weeklySchedule.endTime).toEqual(new Time(18, 0))
    expect(weeklySchedule.targetFocusSessions).toEqual(2)
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

  it('should targetFocusSessions ignore non positive input', () => {
    const newWeeklySchedule = (targetFocusSessions?: number) => {
      return new WeeklySchedule({
        weekdaySet: new Set([Weekday.MON]),
        startTime: new Time(11, 0),
        endTime: new Time(18, 0),
        targetFocusSessions
      })
    }
    expect(newWeeklySchedule(0).targetFocusSessions).toBeNull()
    expect(newWeeklySchedule(-1).targetFocusSessions).toBeNull()
    expect(newWeeklySchedule().targetFocusSessions).toBeNull()

    expect(newWeeklySchedule(1).targetFocusSessions).toBe(1)
  })
})
