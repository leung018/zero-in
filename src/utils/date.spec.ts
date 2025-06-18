import { describe, expect, it } from 'vitest'
import { Time } from '../domain/time'
import { getMostRecentDate, getStartOfNextMinute, isSameDay } from './date'

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
