import { Time } from './time'

export enum Weekday {
  Sun = 0,
  Mon,
  Tue,
  Wed,
  Thu,
  Fri,
  Sat
}

function getWeekdayFromDate(date: Date): Weekday {
  return date.getDay() as Weekday
}

export class WeeklySchedule {
  weekdaySet: ReadonlySet<Weekday>
  readonly startTime: Time
  readonly endTime: Time

  constructor({
    weekdaySet,
    startTime,
    endTime
  }: {
    weekdaySet: ReadonlySet<Weekday>
    startTime: Time
    endTime: Time
  }) {
    if (weekdaySet.size === 0) {
      throw new WeeklyScheduleInvalidInputError('weekdaySet must not be empty')
    }
    if (!startTime.isBefore(endTime)) {
      throw new WeeklyScheduleInvalidInputError('startTime must be before endTime')
    }

    this.weekdaySet = weekdaySet
    this.startTime = startTime
    this.endTime = endTime
  }

  isContain(date: Date): boolean {
    const weekday = getWeekdayFromDate(date)
    if (!this.weekdaySet.has(weekday)) {
      return false
    }
    const currentTime = Time.fromDate(date)
    if (timesAreEqual(currentTime, this.startTime)) {
      return true
    }
    return this.startTime.isBefore(currentTime) && currentTime.isBefore(this.endTime)
  }
}

function timesAreEqual(time1: Time, time2: Time): boolean {
  return time1.hour === time2.hour && time1.minute === time2.minute
}

export class WeeklyScheduleInvalidInputError extends Error {}
