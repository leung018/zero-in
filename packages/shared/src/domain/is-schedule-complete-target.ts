import { ScheduleInstance } from './schedules'
import { FocusSessionRecord } from './timer/record'

export function isScheduleInstanceCompleteTarget(
  instance: ScheduleInstance,
  focusSessionRecords: ReadonlyArray<FocusSessionRecord>
): boolean {
  if (!instance.targetFocusSessions) {
    return false
  }

  const completedSessions = focusSessionRecords.filter((record) =>
    instance.isContain(record.completedAt)
  )

  return completedSessions.length >= instance.targetFocusSessions
}
