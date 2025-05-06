import { WeeklySchedule, type Weekday } from '.'
import { deserializeTime, serializeTime, type SerializedTime } from '../time/serialize'

export type SerializedWeeklySchedules = WeeklyScheduleSchemas[1]

export type WeeklyScheduleSchemas = [
  {
    weekdays: Weekday[]
    startTime: SerializedTime
    endTime: SerializedTime
  }[],
  {
    dataVersion: 1
    schedules: {
      weekdays: Weekday[]
      startTime: SerializedTime
      endTime: SerializedTime
      targetFocusSessions?: number
    }[]
  }
]

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
