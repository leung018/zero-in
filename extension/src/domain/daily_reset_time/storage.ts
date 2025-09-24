import { Time } from '@shared/domain/time'
import { deserializeTime, serializeTime, type SerializedTime } from '@shared/domain/time/serialize'
import { StorageInterface, StorageService } from '../../infra/storage/interface'
import { StorageKey } from '../../infra/storage/key'
import { StorageManager } from '../../infra/storage/manager'

export class DailyResetTimeStorageService implements StorageService<Time> {
  static readonly STORAGE_KEY: StorageKey = 'dailyCutoffTime'

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
