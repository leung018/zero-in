import { ChromeLocalStorageWrapper } from '../../chrome/local_storage'
import { Weekday, WeeklySchedule } from '.'
import { Time } from './time'

export interface WeeklyScheduleStorageService {
  saveAll(WeeklySchedulesList: WeeklySchedule[]): Promise<void>
  getAll(): Promise<WeeklySchedule[]>
}

export class WeeklyScheduleStorageServiceImpl implements WeeklyScheduleStorageService {
  static createFake(): WeeklyScheduleStorageServiceImpl {
    return new WeeklyScheduleStorageServiceImpl(ChromeLocalStorageWrapper.createFake())
  }

  static create(): WeeklyScheduleStorageServiceImpl {
    return new WeeklyScheduleStorageServiceImpl(ChromeLocalStorageWrapper.create())
  }

  private storageWrapper: ChromeLocalStorageWrapper

  private constructor(chromeLocalStorageWrapper: ChromeLocalStorageWrapper) {
    this.storageWrapper = chromeLocalStorageWrapper
  }

  async saveAll(weeklySchedules: WeeklySchedule[]): Promise<void> {
    return this.storageWrapper.set({
      weeklySchedules: weeklySchedules.map(serializeWeeklySchedule)
    })
  }

  async getAll(): Promise<WeeklySchedule[]> {
    return this.storageWrapper.get('weeklySchedules').then((result: any) => {
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
  weekdaySet: ReadonlySet<Weekday>
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
    weekdaySet: weeklySchedule.weekdaySet,
    startTime: serializeTime(weeklySchedule.startTime),
    endTime: serializeTime(weeklySchedule.endTime)
  }
}

function deserializeWeeklySchedule(data: SerializedWeeklySchedule): WeeklySchedule {
  return new WeeklySchedule({
    weekdaySet: data.weekdaySet,
    startTime: deserializeTime(data.startTime),
    endTime: deserializeTime(data.endTime)
  })
}
