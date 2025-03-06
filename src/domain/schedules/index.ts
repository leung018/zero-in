import { Time } from '../time'

export enum Weekday {
  SUN = 0,
  MON,
  TUE,
  WED,
  THU,
  FRI,
  SAT
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

  /**
   * Checks if the time represented by the given date is within the schedule.
   * Note: If the endTime is the same as the time of the date, it will return false.
   * e.g. If the schedule ends at 5:00 PM and the date's time is exactly 5:00 PM, it will return false.
   */
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
