import type { TimerConfig } from '.'
import config from '../../../config'
import { BrowserStorageProvider } from '../../../infra/browser/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../../infra/storage'
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

  private storageWrapper: StorageWrapper<SerializedTimerConfig>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: TimerConfigStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async get(): Promise<TimerConfig> {
    const result = await this.storageWrapper.get()
    if (result) {
      return deserializeTimerConfig(result)
    }

    return config.getDefaultTimerConfig()
  }

  async save(timerConfig: TimerConfig) {
    return this.storageWrapper.set(serializeTimerConfig(timerConfig))
  }
}
