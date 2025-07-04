import { WeeklySchedule } from '.'
import { BrowserStorageProvider } from '../../infra/browser/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'
import { WeeklyScheduleSchemas } from './schema'
import { deserializeWeeklySchedules, serializeWeeklySchedules } from './serialize'

export class WeeklyScheduleStorageService {
  static readonly STORAGE_KEY = 'weeklySchedules'

  static createFake(storage = new FakeStorage()): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(storage)
  }

  static create(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(BrowserStorageProvider.getLocalStorage())
  }

  private storageWrapper: StorageWrapper<WeeklyScheduleSchemas[1]>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: WeeklyScheduleStorageService.STORAGE_KEY,
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
