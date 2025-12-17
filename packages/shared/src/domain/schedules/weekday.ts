export enum Weekday {
  SUN = 0,
  MON,
  TUE,
  WED,
  THU,
  FRI,
  SAT
}

export function getWeekdayFromDate(date: Date): Weekday {
  return date.getDay() as Weekday
}
