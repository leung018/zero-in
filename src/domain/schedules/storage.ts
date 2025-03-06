import { ChromeLocalStorageFactory } from '../../chrome/storage'
import { FakeChromeLocalStorage, type StorageHandler } from '../../infra/storage'
import { Weekday, WeeklySchedule } from '.'
import { Time } from '../time'

export class WeeklyScheduleStorageService {
  static createFake(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(new FakeChromeLocalStorage())
  }

  static create(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(ChromeLocalStorageFactory.createStorageHandler())
  }

  private storageHandler: StorageHandler

  private constructor(storageHandler: StorageHandler) {
    this.storageHandler = storageHandler
  }

  async saveAll(weeklySchedules: WeeklySchedule[]): Promise<void> {
    return this.storageHandler.set({
      weeklySchedules: weeklySchedules.map(serializeWeeklySchedule)
    })
  }

  async getAll(): Promise<WeeklySchedule[]> {
    return this.storageHandler.get('weeklySchedules').then((result: any) => {
      if (result.weeklySchedules) {
        return result.weeklySchedules.map(deserializeWeeklySchedule)
      }

      return []
    })
  }
}

type SerializedTime = {
  hour: number
  minute: number
}

type SerializedWeeklySchedule = {
  weekdays: Weekday[]
  startTime: SerializedTime
  endTime: SerializedTime
}

function serializeTime(time: Time): SerializedTime {
  return {
    hour: time.hour,
    minute: time.minute
  }
}

function deserializeTime(data: SerializedTime): Time {
  return new Time(data.hour, data.minute)
}

function serializeWeeklySchedule(weeklySchedule: WeeklySchedule): SerializedWeeklySchedule {
  return {
    weekdays: Array.from(weeklySchedule.weekdaySet),
    startTime: serializeTime(weeklySchedule.startTime),
    endTime: serializeTime(weeklySchedule.endTime)
  }
}

function deserializeWeeklySchedule(data: SerializedWeeklySchedule): WeeklySchedule {
  return new WeeklySchedule({
    weekdaySet: new Set(data.weekdays),
    startTime: deserializeTime(data.startTime),
    endTime: deserializeTime(data.endTime)
  })
}
