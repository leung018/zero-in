import { ChromeStorageFactory } from '../../chrome/storage'
import { FakeStorage, type Storage } from '../../infra/storage'
import type { PomodoroTimerState } from './timer'

export class TimerStateStorageService {
  static create() {
    return new TimerStateStorageService(ChromeStorageFactory.createLocalStorage())
  }

  static createFake() {
    return new TimerStateStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async get(): Promise<PomodoroTimerState | null> {
    return this.storage.get('pomodoroTimerState').then((result: any) => {
      if (result.pomodoroTimerState) {
        return result.pomodoroTimerState
      }

      return null
    })
  }

  async save(pomodoroTimerState: PomodoroTimerState): Promise<void> {
    return this.storage.set({ pomodoroTimerState })
  }
}
