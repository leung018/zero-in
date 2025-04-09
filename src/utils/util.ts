import type { Time } from '../domain/time'

// TODO: move below to separate files

export function capitalized(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function formatNumber(num: number, minDigits: number = 2): string {
  return num.toLocaleString(undefined, { minimumIntegerDigits: minDigits })
}

export function getNumberWithOrdinal(n: number): string {
  let reminder = n % 100
  if (reminder >= 11 && reminder <= 13) {
    return n + 'th'
  }
  reminder = n % 10
  switch (reminder) {
    case 1:
      return n + 'st'
    case 2:
      return n + 'nd'
    case 3:
      return n + 'rd'
    default:
      return n + 'th'
  }
}

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
