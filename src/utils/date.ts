import type { Time } from '../domain/time'
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

export function getDateAfter(fromDate: Date, duration: Duration) {
  const newDate = new Date(fromDate)
  newDate.setMilliseconds(newDate.getMilliseconds() + duration.totalMilliseconds)
  return newDate
}
