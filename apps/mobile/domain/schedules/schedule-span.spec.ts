import { WeeklySchedule } from '@zero-in/shared/domain/schedules'
import { Weekday } from '@zero-in/shared/domain/schedules/weekday'
import { Time } from '@zero-in/shared/domain/time'
import { newFocusSessionRecord } from '@zero-in/shared/domain/timer/record'
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
    const s2 = new WeeklySchedule({
      weekdaySet: tue,
      startTime: new Time(10, 0),
      endTime: new Time(14, 0)
    })

    const result = findActiveOrNextScheduleSpan([s2, s1], mondayNoon)
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
    const result = findActiveOrNextScheduleSpan([s2, s1], mondayNoon)
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

  it('should find schedule in next week if no remaining schedule on this week', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(9, 0),
      endTime: new Time(12, 0)
    })
    const result = findActiveOrNextScheduleSpan([s1], mondayNoon)
    expect(result).toEqual({
      start: new Date('2026-01-12T09:00:00'),
      end: new Date('2026-01-12T12:00:00')
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

  it('should exclude schedule instances whose targetFocusSessions have been completed', () => {
    const s1 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(10, 0),
      endTime: new Time(12, 0),
      targetFocusSessions: 2
    })
    const s2 = new WeeklySchedule({
      weekdaySet: mon,
      startTime: new Time(14, 0),
      endTime: new Time(16, 0),
      targetFocusSessions: 2
    })

    // s1 has completed target (2 sessions in its time window)
    const records = [
      newFocusSessionRecord({ completedAt: new Date('2026-01-05T10:30:00') }),
      newFocusSessionRecord({ completedAt: new Date('2026-01-05T11:00:00') })
    ]

    // Test at 11:00 when s1 is still active but completed
    const result = findActiveOrNextScheduleSpan([s1, s2], new Date('2026-01-05T11:00:00'), records)
    // Should skip s1 (completed) and return s2
    expect(result).toEqual({
      start: new Date('2026-01-05T14:00:00'),
      end: new Date('2026-01-05T16:00:00')
    })
  })
})
