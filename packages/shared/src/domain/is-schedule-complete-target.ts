import { WeeklySchedule } from './schedules'
import { getWeekdayFromDate, Weekday } from './schedules/weekday'
import { FocusSessionRecord } from './timer/record'

// TODO: Add test for this function
export function isScheduleCompleteTarget(
  schedule: WeeklySchedule,
  focusSessionRecords: ReadonlyArray<FocusSessionRecord>,
  weekday: Weekday
): boolean {
  if (!schedule.targetFocusSessions) {
    return false
  }
  if (!schedule.weekdaySet.has(weekday)) {
    return false
  }

  const completedSessions = focusSessionRecords.filter(
    (record) =>
      schedule.isContain(record.completedAt) && getWeekdayFromDate(record.completedAt) === weekday
  )

  return completedSessions.length >= schedule.targetFocusSessions
}
