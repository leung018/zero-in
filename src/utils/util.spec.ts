import { describe, expect, it } from 'vitest'
import { getDomain, getMostRecentDate, isPrimitive } from './util'
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

describe('getDomain', () => {
  it('should extract domain from URL with www', () => {
    expect(getDomain('https://www.example.com')).toBe('example.com')
    expect(getDomain('http://www.example.com')).toBe('example.com')
  })

  it('should extract domain from URL without www', () => {
    expect(getDomain('https://example.com')).toBe('example.com')
    expect(getDomain('http://example.com')).toBe('example.com')
  })

  it('should extract domain with URL / at the end', () => {
    expect(getDomain('https://www.example.com/')).toBe('example.com')
    expect(getDomain('http://example.com/')).toBe('example.com')
  })

  it('should extract domain from URL without protocol but with www', () => {
    expect(getDomain('www.example.com')).toBe('example.com')
  })

  it('should extract domain from URL without protocol and www', () => {
    expect(getDomain('example.com')).toBe('example.com')
  })

  it('should extract domain and ignore paths', () => {
    expect(getDomain('https://www.example.com/path/to/resource')).toBe('example.com')
  })

  it('should keep subdomain', () => {
    expect(getDomain('subdomain.example.com')).toBe('subdomain.example.com')
  })

  it('should be case insensitive', () => {
    expect(getDomain('HTTPS://www.EXAMPLE.com')).toBe('example.com')
  })
})

describe('isPrimitive', () => {
  it('should correctly identify primitive values', () => {
    expect(isPrimitive(null)).toBe(true)
    expect(isPrimitive('hello')).toBe(true)
    expect(isPrimitive(42)).toBe(true)
    expect(isPrimitive(true)).toBe(true)
    expect(isPrimitive(undefined)).toBe(true)
    expect(isPrimitive(Symbol('sym'))).toBe(true)
    expect(isPrimitive(123n)).toBe(true)
  })

  it('should correctly identify non-primitive values', () => {
    expect(isPrimitive({})).toBe(false)
    expect(isPrimitive([])).toBe(false)
    expect(isPrimitive(() => {})).toBe(false)
    expect(isPrimitive(new Date())).toBe(false)
    expect(isPrimitive(new Map())).toBe(false)
    expect(isPrimitive(new Set())).toBe(false)
  })
})
