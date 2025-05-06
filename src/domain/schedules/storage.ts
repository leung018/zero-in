import { ChromeStorageProvider } from '../../infra/chrome/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'
import { WeeklySchedule } from '.'
import {
  deserializeWeeklySchedules,
  serializeWeeklySchedules,
  type WeeklyScheduleSchemas
} from './serialize'

export const STORAGE_KEY = 'weeklySchedules'

export class WeeklyScheduleStorageService {
  static createFake(storage = new FakeStorage()): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(storage)
  }

  static create(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(ChromeStorageProvider.getLocalStorage())
  }

  private storageWrapper: StorageWrapper<WeeklyScheduleSchemas[1]>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: STORAGE_KEY,
      currentDataVersion: 1,
      migrators: [
        {
          oldDataVersion: undefined,
          migratorFunc: (oldData: WeeklyScheduleSchemas[0]): WeeklyScheduleSchemas[1] => {
            return {
              dataVersion: 1,
              schedules: oldData.map((schedule) => ({
                weekdays: schedule.weekdays,
                startTime: schedule.startTime,
                endTime: schedule.endTime
              }))
            }
          }
        }
      ]
    })
  }

  async saveAll(weeklySchedules: WeeklySchedule[]): Promise<void> {
    return this.storageWrapper.set(serializeWeeklySchedules(weeklySchedules))
  }

  async getAll(): Promise<WeeklySchedule[]> {
    const result = await this.storageWrapper.get()
    if (result == null) {
      return []
    }

    return deserializeWeeklySchedules(result)
  }
}
