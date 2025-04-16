import type { TimerConfig } from '.'
import { ChromeStorageProvider } from '../../../chrome/storage'
import config from '../../../config'
import { FakeStorage, type Storage } from '../../../infra/storage'
import { deserializeTimerConfig, serializeTimerConfig } from './serialize'

const STORAGE_KEY = 'timerConfig'

export class TimerConfigStorageService {
  static create() {
    return new TimerConfigStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new TimerConfigStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async get(): Promise<TimerConfig> {
    const result = await this.storage.get(STORAGE_KEY)
    if (result[STORAGE_KEY]) {
      return deserializeTimerConfig(result[STORAGE_KEY])
    }

    return config.getDefaultTimerConfig()
  }

  async save(timerConfig: TimerConfig) {
    return this.storage.set({
      [STORAGE_KEY]: serializeTimerConfig(timerConfig)
    })
  }
}
