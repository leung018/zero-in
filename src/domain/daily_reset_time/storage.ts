import { ChromeStorageProvider } from '../../chrome/storage'
import { FakeStorage, type Storage } from '../../infra/storage'
import { Time } from '../time'
import { deserializeTime, serializeTime } from '../time/serialize'

export class DailyResetTimeStorageService {
  static create() {
    return new DailyResetTimeStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new DailyResetTimeStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async save(dailyResetTime: Time) {
    return this.storage.set({
      dailyCutoffTime: serializeTime(dailyResetTime)
    })
  }

  async get(): Promise<Time> {
    return this.storage.get('dailyCutoffTime').then((result) => {
      if (result.dailyCutoffTime) {
        return deserializeTime(result.dailyCutoffTime)
      }

      return new Time(0, 0)
    })
  }
}
