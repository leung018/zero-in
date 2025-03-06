import { Time } from '../schedules/time'

export class DailyCutoffTimeStorageService {
  static createFake() {
    return new DailyCutoffTimeStorageService()
  }

  async save(dailyCutoffTime: Time) {}

  async get(): Promise<Time> {
    return new Time(10, 30)
  }
}
