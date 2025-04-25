import type { Time } from '../domain/time'

export function getMostRecentDate(time: Time, currentDate = new Date()): Date {
  const newDate = new Date(currentDate)
  newDate.setHours(time.hour, time.minute, 0, 0)

  if (newDate > currentDate) {
    newDate.setDate(newDate.getDate() - 1)
  }

  return newDate
}
