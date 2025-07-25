import { WeeklySchedule } from '.'
import { BrowserStorageProvider } from '../../infra/browser/storage'
import { FakeStorage, StorageManager, type Storage } from '../../infra/storage'
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

  private storageManager: StorageManager<WeeklyScheduleSchemas[1]>

  private constructor(storage: Storage) {
    this.storageManager = new StorageManager({
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
    return this.storageManager.set(serializeWeeklySchedules(weeklySchedules))
  }

  async getAll(): Promise<WeeklySchedule[]> {
    const result = await this.storageManager.get()
    if (result == null) {
      return []
    }

    return deserializeWeeklySchedules(result)
  }
}
