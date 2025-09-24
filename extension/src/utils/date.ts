import type { Time } from '@shared/domain/time'
import { Duration } from '../domain/timer/duration'

export function getMostRecentDate(time: Time, currentDate = new Date()): Date {
  const newDate = new Date(currentDate)
  newDate.setHours(time.hour, time.minute, 0, 0)

  if (newDate > currentDate) {
    newDate.setDate(newDate.getDate() - 1)
  }

  return newDate
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function getStartOfNextMinute(fromDate: Date = new Date()): Date {
  const nextMinute = new Date(fromDate)
  nextMinute.setSeconds(0, 0)
  nextMinute.setMinutes(nextMinute.getMinutes() + 1)
  return nextMinute
}

export function getDateAfter({ from = new Date(), duration }: { from?: Date; duration: Duration }) {
  const newDate = new Date(from)
  newDate.setMilliseconds(newDate.getMilliseconds() + duration.totalMilliseconds)
  return newDate
}

/**
 * Calculates the duration between two dates. If the start date is after the end date, returns a duration of 0.
 */
export function dateDiff(start: Date, end: Date): Duration {
  if (start.getTime() > end.getTime()) {
    return new Duration({ milliseconds: 0 })
  }

  return new Duration({
    milliseconds: end.getTime() - start.getTime()
  })
}
