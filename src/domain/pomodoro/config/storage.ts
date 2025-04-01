import type { PomodoroTimerConfig } from '.'
import { ChromeStorageFactory } from '../../../chrome/storage'
import config from '../../../config'
import { FakeStorage, type Storage } from '../../../infra/storage'
import { deserializePomodoroTimerConfig, serializePomodoroTimerConfig } from './serialize'

const STORAGE_KEY = 'timerConfig'

export class PomodoroTimerConfigStorageService {
  static create() {
    return new PomodoroTimerConfigStorageService(ChromeStorageFactory.createLocalStorage())
  }

  static createFake() {
    return new PomodoroTimerConfigStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async get(): Promise<PomodoroTimerConfig> {
    return this.storage.get(STORAGE_KEY).then((result: any) => {
      if (result[STORAGE_KEY]) {
        return deserializePomodoroTimerConfig(result[STORAGE_KEY])
      }

      return config.getDefaultPomodoroTimerConfig()
    })
  }

  async save(pomodoroTimerConfig: PomodoroTimerConfig) {
    return this.storage.set({
      [STORAGE_KEY]: serializePomodoroTimerConfig(pomodoroTimerConfig)
    })
  }
}
