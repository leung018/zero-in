import type { TimerIntegrationSetting } from '.'
import { FakeStorage, type Storage } from '../../infra/storage'

const STORAGE_KEY = 'timerIntegrationSetting'

export class TimerIntegrationSettingStorageService {
  static createFake() {
    return new TimerIntegrationSettingStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async get(): Promise<TimerIntegrationSetting> {
    const result = await this.storage.get(STORAGE_KEY)
    if (result[STORAGE_KEY]) {
      return result[STORAGE_KEY]
    }
    return {
      shouldPauseBlockingDuringBreaks: true
    }
  }

  async save(setting: TimerIntegrationSetting) {
    return this.storage.set({
      [STORAGE_KEY]: setting
    })
  }
}
