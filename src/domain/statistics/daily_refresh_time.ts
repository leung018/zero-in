import { Time } from '../schedules/time'

export class DailyRefreshTimeStorageService {
  static createFake() {
    return new DailyRefreshTimeStorageService()
  }

  async save(dailyRefreshTime: Time) {}

  async get(): Promise<Time> {
    return new Time(10, 30)
  }
}
