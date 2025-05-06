import { ChromeStorageProvider } from '../../infra/chrome/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'
import { Time } from '../time'
import { deserializeTime, serializeTime, type SerializedTime } from '../time/serialize'

export class DailyResetTimeStorageService {
  static STORAGE_KEY = 'dailyCutoffTime'

  static create() {
    return new DailyResetTimeStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new DailyResetTimeStorageService(new FakeStorage())
  }

  private storageWrapper: StorageWrapper<SerializedTime>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: DailyResetTimeStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async save(dailyResetTime: Time) {
    return this.storageWrapper.set(serializeTime(dailyResetTime))
  }

  async get(): Promise<Time> {
    const result = await this.storageWrapper.get()
    if (result) {
      return deserializeTime(result)
    }
    return new Time(0, 0)
  }
}
