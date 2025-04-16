import { ChromeStorageProvider } from '../../chrome/storage'
import { FakeStorage, type Storage } from '../../infra/storage'
import { WeeklySchedule } from '.'
import { deserializeWeeklySchedule, serializeWeeklySchedule } from './serialize'

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
      weeklySchedules: weeklySchedules.map(serializeWeeklySchedule)
    })
  }

  async getAll(): Promise<WeeklySchedule[]> {
    const result = await this.storage.get('weeklySchedules')

    if (result.weeklySchedules) {
      return result.weeklySchedules.map(deserializeWeeklySchedule)
    }

    return []
  }
}
