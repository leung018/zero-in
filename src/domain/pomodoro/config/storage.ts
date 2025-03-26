import type { PomodoroTimerConfig } from '.'
import config from '../../../config'
import { FakeStorage, type Storage } from '../../../infra/storage'

export class PomodoroTimerConfigStorageService {
  static createFake() {
    return new PomodoroTimerConfigStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async get(): Promise<PomodoroTimerConfig> {
    return this.storage.get('pomodoroTimerConfig').then((result: any) => {
      if (result.pomodoroTimerConfig) {
        return result.pomodoroTimerConfig
      }

      return config.getPomodoroTimerConfig()
    })
  }

  async save(pomodoroTimerConfig: PomodoroTimerConfig) {
    return this.storage.set({ pomodoroTimerConfig })
  }
}
