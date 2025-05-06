import { ChromeStorageProvider } from '../../infra/chrome/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'
import { WeeklySchedule } from '.'
import {
  deserializeWeeklySchedules,
  serializeWeeklySchedules,
  type SerializedWeeklySchedules
} from './serialize'

const STORAGE_KEY = 'weeklySchedules'

export class WeeklyScheduleStorageService {
  static createFake(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(new FakeStorage())
  }

  static create(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(ChromeStorageProvider.getLocalStorage())
  }

  private storageWrapper: StorageWrapper<SerializedWeeklySchedules>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: STORAGE_KEY,
      migrators: []
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
