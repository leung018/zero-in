import { ChromeLocalStorageFactory } from '../../chrome/storage'
import { FakeChromeLocalStorage, type StorageHandler } from '../../infra/storage'
import { WeeklySchedule } from '.'
import { deserializeWeeklySchedule, serializeWeeklySchedule } from './serialize'

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
