import type { Time } from './time'

export enum Weekday {
  Sun = 0,
  Mon,
  Tue,
  Wed,
  Thu,
  Fri,
  Sat
}

export class WeeklySchedules {
  weekdaySet: ReadonlySet<Weekday>
  readonly startTime: Time
  readonly endTime: Time

  constructor({
    weekdaySet,
    startTime,
    endTime
  }: {
    weekdaySet: Set<Weekday>
    startTime: Time
    endTime: Time
  }) {
    this.weekdaySet = weekdaySet
    this.startTime = startTime
    this.endTime = endTime
  }
}
