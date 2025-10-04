import { WeeklySchedule } from '.'
import { AdaptiveStorageProvider } from '../../infra/storage/adaptive'
import { StorageInterface, StorageService } from '../../infra/storage/interface'
import { StorageKey } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local-storage'
import { StorageManager } from '../../infra/storage/manager'
import { WeeklyScheduleSchemas } from './schema'
import { deserializeWeeklySchedules, serializeWeeklySchedules } from './serialize'

export class WeeklySchedulesStorageService implements StorageService<WeeklySchedule[]> {
  static readonly STORAGE_KEY: StorageKey = 'weeklySchedules'

  static createFake(): WeeklySchedulesStorageService {
    return new WeeklySchedulesStorageService(LocalStorageWrapper.createFake())
  }

  static create(): WeeklySchedulesStorageService {
    return new WeeklySchedulesStorageService(AdaptiveStorageProvider.create())
  }

  private storageManager: StorageManager<WeeklyScheduleSchemas[2]>

  constructor(storage: StorageInterface) {
    this.storageManager = StorageManager.create({
      storage,
      key: WeeklySchedulesStorageService.STORAGE_KEY,
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

  async save(weeklySchedules: WeeklySchedule[]): Promise<void> {
    return this.storageManager.set(serializeWeeklySchedules(weeklySchedules))
  }

  async get(): Promise<WeeklySchedule[]> {
    const result = await this.storageManager.get()
    if (result == null) {
      return []
    }

    return deserializeWeeklySchedules(result)
  }
}
