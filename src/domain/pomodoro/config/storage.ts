import type { TimerConfig } from '.'
import { ChromeStorageProvider } from '../../../infra/chrome/storage'
import config from '../../../config'
import { FakeStorage, StorageWrapper, type Storage } from '../../../infra/storage'
import {
  deserializeTimerConfig,
  serializeTimerConfig,
  type SerializedTimerConfig
} from './serialize'

const STORAGE_KEY = 'timerConfig'

export class TimerConfigStorageService {
  static create() {
    return new TimerConfigStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new TimerConfigStorageService(new FakeStorage())
  }

  private storageWrapper: StorageWrapper<SerializedTimerConfig>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: STORAGE_KEY,
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
