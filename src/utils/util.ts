import type { Time } from '../domain/time'

// TODO: move below to separate files

export function getMostRecentDate(time: Time, currentDate = new Date()): Date {
  const newDate = new Date(currentDate)
  newDate.setHours(time.hour, time.minute, 0, 0)

  if (newDate > currentDate) {
    newDate.setDate(newDate.getDate() - 1)
  }

  return newDate
}

export function getDomain(url: string): string {
  // Remove protocol and 'www.'
  url = url.replace(/(https?:\/\/)?(www\.)?/i, '')

  // Remove any path after the domain
  if (url.indexOf('/') !== -1) {
    return url.split('/')[0]
  }

  return url.toLowerCase()
}

export function isPrimitive(value: unknown): boolean {
  const type = typeof value
  return (
    value === null ||
    type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'undefined' ||
    type === 'symbol' ||
    type === 'bigint'
  )
}
