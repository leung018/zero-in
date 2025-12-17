import { SerializedTime } from '@zero-in/shared/domain/time/serialize'
import { Weekday } from './weekday'

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
  },
  {
    dataVersion: 2
    schedules: {
      weekdays: Weekday[]
      startTime: SerializedTime
      endTime: SerializedTime
      targetFocusSessions: number | null
    }[]
  }
]
