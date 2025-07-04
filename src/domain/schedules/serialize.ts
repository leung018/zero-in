import { WeeklySchedule } from '.'
import { deserializeTime, serializeTime } from '../time/serialize'
import { WeeklyScheduleSchemas } from './schema'

type SerializedWeeklySchedules = WeeklyScheduleSchemas[1]

export function serializeWeeklySchedules(
  weeklySchedules: ReadonlyArray<WeeklySchedule>
): SerializedWeeklySchedules {
  return {
    dataVersion: 1,
    schedules: weeklySchedules.map((schedule) => ({
      weekdays: Array.from(schedule.weekdaySet),
      startTime: serializeTime(schedule.startTime),
      endTime: serializeTime(schedule.endTime),
      targetFocusSessions: schedule.targetFocusSessions
    }))
  }
}

export function deserializeWeeklySchedules(data: SerializedWeeklySchedules): WeeklySchedule[] {
  return data.schedules.map((schedule) => {
    return new WeeklySchedule({
      weekdaySet: new Set(schedule.weekdays),
      startTime: deserializeTime(schedule.startTime),
      endTime: deserializeTime(schedule.endTime),
      targetFocusSessions: schedule.targetFocusSessions
    })
  })
}
