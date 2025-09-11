import { WeeklySchedule } from '.'
import { StorageInterface } from '../../infra/storage/interface'
import { StorageKey } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { StorageManager } from '../../infra/storage/manager'
import { AdaptiveStorageProvider } from '../../infra/storage/provider'
import { WeeklyScheduleSchemas } from './schema'
import { deserializeWeeklySchedules, serializeWeeklySchedules } from './serialize'

export class WeeklyScheduleStorageService {
  static readonly STORAGE_KEY: StorageKey = 'weeklySchedules'

  static createFake(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(LocalStorageWrapper.createFake())
  }

  static create(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(AdaptiveStorageProvider.create())
  }

  private storageManager: StorageManager<WeeklyScheduleSchemas[2]>

  constructor(storage: StorageInterface) {
    this.storageManager = new StorageManager({
      storage,
      key: WeeklyScheduleStorageService.STORAGE_KEY,
      currentDataVersion: 2,
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
        },
        {
          oldDataVersion: 1,
          migratorFunc: (oldData: WeeklyScheduleSchemas[1]): WeeklyScheduleSchemas[2] => {
            return {
              dataVersion: 2,
              schedules: oldData.schedules.map((schedule) => ({
                weekdays: schedule.weekdays,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                targetFocusSessions: schedule.targetFocusSessions ?? null
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
