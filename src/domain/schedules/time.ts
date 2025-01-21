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
}

export class TimeInvalidInputError extends Error {}
