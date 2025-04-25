import { describe, expect, it } from 'vitest'
import { getMostRecentDate } from './date'
import { Time } from '../domain/time'

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
