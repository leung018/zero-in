import { WeeklySchedule, type Weekday } from '.'
import { deserializeTime, serializeTime, type SerializedTime } from '../time/serialize'

type SerializedWeeklySchedule = {
  weekdays: Weekday[]
  startTime: SerializedTime
  endTime: SerializedTime
}

export function serializeWeeklySchedule(weeklySchedule: WeeklySchedule): SerializedWeeklySchedule {
  return {
    weekdays: Array.from(weeklySchedule.weekdaySet),
    startTime: serializeTime(weeklySchedule.startTime),
    endTime: serializeTime(weeklySchedule.endTime)
  }
}

export function deserializeWeeklySchedule(data: SerializedWeeklySchedule): WeeklySchedule {
  return new WeeklySchedule({
    weekdaySet: new Set(data.weekdays),
    startTime: deserializeTime(data.startTime),
    endTime: deserializeTime(data.endTime)
  })
}
