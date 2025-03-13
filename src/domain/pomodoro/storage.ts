import { ChromeLocalStorageFactory } from '../../chrome/storage'
import { FakeChromeLocalStorage, type StorageHandler } from '../../infra/storage'
import type { PomodoroTimerState } from './timer'

export class TimerStateStorageService {
  static create() {
    return new TimerStateStorageService(ChromeLocalStorageFactory.createStorageHandler())
  }

  static createFake() {
    return new TimerStateStorageService(new FakeChromeLocalStorage())
  }

  private storageHandler: StorageHandler

  private constructor(storageHandler: StorageHandler) {
    this.storageHandler = storageHandler
  }

  async get(): Promise<PomodoroTimerState | null> {
    return this.storageHandler.get('pomodoroTimerState').then((result: any) => {
      if (result.pomodoroTimerState) {
        return result.pomodoroTimerState
      }

      return null
    })
  }

  async save(pomodoroTimerState: PomodoroTimerState): Promise<void> {
    return this.storageHandler.set({ pomodoroTimerState })
  }
}
