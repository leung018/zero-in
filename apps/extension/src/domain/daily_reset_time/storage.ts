import { Time } from '@zero-in/shared/domain/time/index'
import {
  deserializeTime,
  serializeTime,
  type SerializedTime
} from '@zero-in/shared/domain/time/serialize'
import { AdaptiveStorageProvider } from '../../infra/storage/adaptive'
import { StorageInterface, StorageService } from '../../infra/storage/interface'
import { StorageKey } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { StorageManager } from '../../infra/storage/manager'

export class DailyResetTimeStorageService implements StorageService<Time> {
  static readonly STORAGE_KEY: StorageKey = 'dailyCutoffTime'

  static create() {
    return new DailyResetTimeStorageService(AdaptiveStorageProvider.create())
  }

  static createFake() {
    return new DailyResetTimeStorageService(LocalStorageWrapper.createFake())
  }

  private storageManager: StorageManager<SerializedTime>

  constructor(storage: StorageInterface) {
    this.storageManager = StorageManager.create({
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
