import { StorageInterface } from '../../infra/storage/interface'
import { LocalStorageWrapper } from '../../infra/storage/local_storage_wrapper'
import { StorageManager } from '../../infra/storage/manager'
import { AdaptiveStorageProvider } from '../../infra/storage/provider'
import { Time } from '../time'
import { deserializeTime, serializeTime, type SerializedTime } from '../time/serialize'

export class DailyResetTimeStorageService {
  static readonly STORAGE_KEY = 'dailyCutoffTime'

  static create() {
    return new DailyResetTimeStorageService(AdaptiveStorageProvider.create())
  }

  static createFake() {
    return new DailyResetTimeStorageService(LocalStorageWrapper.createFake())
  }

  private storageManager: StorageManager<SerializedTime>

  constructor(storage: StorageInterface) {
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
