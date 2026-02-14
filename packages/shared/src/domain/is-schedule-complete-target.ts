import { WeeklySchedule } from './schedules'
import { FocusSessionRecord } from './timer/record'

export function isScheduleCompleteTarget(
  schedule: WeeklySchedule,
  focusSessionRecords: ReadonlyArray<FocusSessionRecord>
): boolean {
  if (!schedule.targetFocusSessions) {
    return false
  }

  const completedSessions = focusSessionRecords.filter((record) =>
    schedule.isContain(record.completedAt)
  )

  return completedSessions.length >= schedule.targetFocusSessions
}
