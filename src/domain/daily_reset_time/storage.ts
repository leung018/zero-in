import { ChromeStorageProvider } from '../../chrome/storage'
import { FakeStorage, type Storage } from '../../infra/storage'
import { Time } from '../time'
import { deserializeTime, serializeTime } from '../time/serialize'

const STORAGE_KEY = 'dailyCutoffTime'

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
      [STORAGE_KEY]: serializeTime(dailyResetTime)
    })
  }

  async get(): Promise<Time> {
    const result = await this.storage.get(STORAGE_KEY)
    if (result[STORAGE_KEY]) {
      return deserializeTime(result[STORAGE_KEY])
    }
    return new Time(0, 0)
  }
}
