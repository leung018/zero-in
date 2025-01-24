export class Time {
  readonly hour: number
  readonly minute: number

  constructor(hour: number, minute: number) {
    if (hour < 0 || hour >= 24) {
      throw new TimeInvalidInputError('Invalid hour')
    }
    if (minute < 0 || minute >= 60) {
      throw new TimeInvalidInputError('Invalid minute')
    }

    this.hour = hour
    this.minute = minute
  }

  isBefore(otherTime: Time): boolean {
    if (this.hour < otherTime.hour) return true
    if (this.hour == otherTime.hour && this.minute < otherTime.minute) return true
    return false
  }
}

export class TimeInvalidInputError extends Error {}

export function formatTimeNumber(num: number): string {
  return num.toLocaleString(undefined, { minimumIntegerDigits: 2 })
}
