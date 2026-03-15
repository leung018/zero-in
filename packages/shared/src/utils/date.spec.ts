import { Time } from '@zero-in/shared/domain/time/index'
import { describe, expect, test as it } from 'vitest'
import { Duration } from '../domain/timer/duration'
import { getDateAfter, getMostRecentDate, getStartOfNextMinute, isSameDay, maxDate } from './date'

describe('getMostRecentDate', () => {
  it('should return today time if already passed', () => {
    expect(getMostRecentDate(new Time(15, 0), new Date('2021-01-01T23:59:00'))).toEqual(
      new Date('2021-01-01T15:00:00')
    )
    expect(getMostRecentDate(new Time(15, 0), new Date('2021-01-01T15:00:00'))).toEqual(
      new Date('2021-01-01T15:00:00')
    )
  })

  it('should return yesterday time if not yet passed', () => {
    expect(getMostRecentDate(new Time(15, 0), new Date('2021-01-01T14:59:00'))).toEqual(
      new Date('2020-12-31T15:00:00')
    )
  })
})

describe('isSameDay', () => {
  it('should return true for same day with different times', () => {
    expect(isSameDay(new Date('2021-01-01T00:00:00'), new Date('2021-01-01T23:59:59'))).toBe(true)

    expect(isSameDay(new Date('2021-01-01T12:30:45'), new Date('2021-01-01T08:15:30'))).toBe(true)
  })

  it('should return false for different days', () => {
    expect(isSameDay(new Date('2021-01-01T12:00:00'), new Date('2021-01-02T12:00:00'))).toBe(false)
  })

  it('should return false for different months', () => {
    expect(isSameDay(new Date('2021-01-15T12:00:00'), new Date('2021-02-15T12:00:00'))).toBe(false)
  })

  it('should return false for different years', () => {
    expect(isSameDay(new Date('2021-01-01T12:00:00'), new Date('2022-01-01T12:00:00'))).toBe(false)
  })

  it('should handle date boundaries correctly', () => {
    expect(isSameDay(new Date('2021-01-01T00:00:00'), new Date('2021-01-01T23:59:59'))).toBe(true)

    expect(isSameDay(new Date('2021-01-01T23:59:59'), new Date('2021-01-02T00:00:00'))).toBe(false)
  })
})

describe('getStartOfNextMinute', () => {
  it('should return the start of the next minute', () => {
    expect(getStartOfNextMinute(new Date('2021-01-01T12:34:56'))).toEqual(
      new Date('2021-01-01T12:35:00')
    )
    expect(getStartOfNextMinute(new Date('2021-01-01T12:34:00'))).toEqual(
      new Date('2021-01-01T12:35:00')
    )
    expect(getStartOfNextMinute(new Date('2021-01-01T23:59:59'))).toEqual(
      new Date('2021-01-02T00:00:00')
    )
  })
})

describe('getDateAfter', () => {
  it('should return the date after the given duration', () => {
    expect(
      getDateAfter({
        from: new Date('2021-01-01T12:00:00'),
        duration: new Duration({ minutes: 1 })
      })
    ).toEqual(new Date('2021-01-01T12:01:00'))
  })
})

describe('maxDate', () => {
  it('returns the latest date among provided dates', () => {
    const d1 = new Date(2020, 0, 1)
    const d2 = new Date(2021, 0, 1)
    const d3 = new Date(2019, 11, 31)

    const result = maxDate(d1, d2, d3)
    expect(result.getTime()).toBe(d2.getTime())
  })

  it('returns a new Date instance (does not return the same reference)', () => {
    const d = new Date()
    const result = maxDate(d)
    expect(result).not.toBe(d)
    expect(result.getTime()).toBe(d.getTime())
  })
})
