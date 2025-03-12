import { ChromeLocalStorageFactory } from '../../chrome/storage'
import { FakeChromeLocalStorage, type StorageHandler } from '../../infra/storage'
import type { PomodoroTimerUpdate } from './timer'

export class TimerUpdateStorageService {
  static create() {
    return new TimerUpdateStorageService(ChromeLocalStorageFactory.createStorageHandler())
  }

  static createFake() {
    return new TimerUpdateStorageService(new FakeChromeLocalStorage())
  }

  private storageHandler: StorageHandler

  private constructor(storageHandler: StorageHandler) {
    this.storageHandler = storageHandler
  }

  async get(): Promise<PomodoroTimerUpdate | null> {
    return this.storageHandler.get('pomodoroTimerUpdate').then((result: any) => {
      if (result.pomodoroTimerUpdate) {
        return result.pomodoroTimerUpdate
      }

      return null
    })
  }

  async save(pomodoroTimerUpdate: PomodoroTimerUpdate): Promise<void> {
    return this.storageHandler.set({ pomodoroTimerUpdate })
  }
}
