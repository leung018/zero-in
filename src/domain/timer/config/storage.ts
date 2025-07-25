import type { TimerConfig } from '.'
import config from '../../../config'
import { BrowserStorageProvider } from '../../../infra/browser/storage'
import { FakeStorage, StorageManager, type Storage } from '../../../infra/storage'
import {
  deserializeTimerConfig,
  serializeTimerConfig,
  type SerializedTimerConfig
} from './serialize'

export class TimerConfigStorageService {
  static readonly STORAGE_KEY = 'timerConfig'

  static create() {
    return new TimerConfigStorageService(BrowserStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new TimerConfigStorageService(new FakeStorage())
  }

  private storageManager: StorageManager<SerializedTimerConfig>

  private constructor(storage: Storage) {
    this.storageManager = new StorageManager({
      storage,
      key: TimerConfigStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async get(): Promise<TimerConfig> {
    const result = await this.storageManager.get()
    if (result) {
      return deserializeTimerConfig(result)
    }

    return config.getDefaultTimerConfig()
  }

  async save(timerConfig: TimerConfig) {
    return this.storageManager.set(serializeTimerConfig(timerConfig))
  }
}
