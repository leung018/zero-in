import { WeeklySchedule } from '@zero-in/shared/domain/schedules'
import { Weekday } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time'
import { findActiveOrNextScheduleSpan } from './schedule-span'

describe('findActiveOrNextScheduleSpan', () => {
  const mon = new Set([Weekday.MON])
  const tue = new Set([Weekday.TUE])

  // 2026-01-05 is a Monday
  const mondayNoon = new Date('2026-01-05T12:00:00')

  it('should return null if no schedules', () => {
    expect(findActiveOrNextScheduleSpan([], mondayNoon)).toBeNull()
  })

  it('should find current schedule if it exists', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(10, 0),
      endTime: new Time(14, 0)
    })
    const result = findActiveOrNextScheduleSpan([s1], mondayNoon)
    expect(result).toEqual({
      start: new Date('2026-01-05T10:00:00'),
      end: new Date('2026-01-05T14:00:00')
    })
  })

  it('should find next schedule if none active', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(14, 0),
      endTime: new Time(18, 0)
    })
    const result = findActiveOrNextScheduleSpan([s1], mondayNoon)
    expect(result).toEqual({
      start: new Date('2026-01-05T14:00:00'),
      end: new Date('2026-01-05T18:00:00')
    })
  })

  it('should combine overlapping schedules into the longest continuous block', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    const s2 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(11, 0),
      endTime: new Time(14, 0)
    })
    // 10:00-12:00 and 11:00-14:00 should become 10:00-14:00
    const result = findActiveOrNextScheduleSpan([s1, s2], mondayNoon)
    expect(result).toEqual({
      start: new Date('2026-01-05T10:00:00'),
      end: new Date('2026-01-05T14:00:00')
    })
  })

  it('should combine adjacent schedules into one span', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    const s2 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(12, 0),
      endTime: new Time(14, 0)
    })
    // 10:00-12:00 and 12:00-14:00 should become 10:00-14:00
    const result = findActiveOrNextScheduleSpan([s1, s2], mondayNoon)
    expect(result).toEqual({
      start: new Date('2026-01-05T10:00:00'),
      end: new Date('2026-01-05T14:00:00')
    })
  })

  it('should find next day schedule if no more schedules today', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: tue,
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    const result = findActiveOrNextScheduleSpan([s1], mondayNoon)
    expect(result).toEqual({
      start: new Date('2026-01-06T10:00:00'),
      end: new Date('2026-01-06T12:00:00')
    })
  })

  it('should find schedule later in the week', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: new Set([Weekday.FRI]), // Friday
      startTime: new Time(10, 0),
      endTime: new Time(12, 0)
    })
    // Monday 2026-01-05
    // Friday is 01-09 (within 7 days)
    const result = findActiveOrNextScheduleSpan([s1], mondayNoon)
    expect(result).toEqual({
      start: new Date('2026-01-09T10:00:00'),
      end: new Date('2026-01-09T12:00:00')
    })
  })

  it('should handle multiple disjoint schedules and pick the first relevant one', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(8, 0),
      endTime: new Time(9, 0)
    })
    const s2 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(15, 0),
      endTime: new Time(16, 0)
    })

    // now is 12:00. s1 is past, s2 is next.
    const result = findActiveOrNextScheduleSpan([s1, s2], mondayNoon)
    expect(result).toEqual({
      start: new Date('2026-01-05T15:00:00'),
      end: new Date('2026-01-05T16:00:00')
    })
  })
})
