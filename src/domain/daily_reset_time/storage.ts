import { BrowserStorageProvider } from '../../infra/browser/storage'
import { FakeLocalStorage, StorageManager, type LocalStorage } from '../../infra/storage'
import { Time } from '../time'
import { deserializeTime, serializeTime, type SerializedTime } from '../time/serialize'

export class DailyResetTimeStorageService {
  static readonly STORAGE_KEY = 'dailyCutoffTime'

  static create() {
    return new DailyResetTimeStorageService(BrowserStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new DailyResetTimeStorageService(new FakeLocalStorage())
  }

  private storageManager: StorageManager<SerializedTime>

  private constructor(storage: LocalStorage) {
    this.storageManager = new StorageManager({
      storage,
      key: DailyResetTimeStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async save(dailyResetTime: Time) {
    return this.storageManager.set(serializeTime(dailyResetTime))
  }

  async get(): Promise<Time> {
    const result = await this.storageManager.get()
    if (result) {
      return deserializeTime(result)
    }
    return new Time(0, 0)
  }
}
