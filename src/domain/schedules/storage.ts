import { ChromeStorageProvider } from '../../chrome/storage'
import { FakeStorage, type Storage } from '../../infra/storage'
import { WeeklySchedule } from '.'
import { deserializeWeeklySchedule, serializeWeeklySchedule } from './serialize'

const STORAGE_KEY = 'weeklySchedules'

export class WeeklyScheduleStorageService {
  static createFake(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(new FakeStorage())
  }

  static create(): WeeklyScheduleStorageService {
    return new WeeklyScheduleStorageService(ChromeStorageProvider.getLocalStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async saveAll(weeklySchedules: WeeklySchedule[]): Promise<void> {
    return this.storage.set({
      [STORAGE_KEY]: weeklySchedules.map(serializeWeeklySchedule)
    })
  }

  async getAll(): Promise<WeeklySchedule[]> {
    const result = await this.storage.get(STORAGE_KEY)

    if (result[STORAGE_KEY]) {
      return result[STORAGE_KEY].map(deserializeWeeklySchedule)
    }

    return []
  }
}
