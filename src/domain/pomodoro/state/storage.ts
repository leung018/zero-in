import { ChromeStorageProvider } from '../../../chrome/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../../infra/storage'
import type { TimerState } from '.'
import { deserializeTimerState, serializeTimerState, type TimerStateSchemas } from './serialize'

export const STORAGE_KEY = 'timerState'

export class TimerStateStorageService {
  static create() {
    return new TimerStateStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake({ storage = new FakeStorage() } = {}) {
    return new TimerStateStorageService(storage)
  }

  private storageWrapper: StorageWrapper<TimerStateSchemas[1]>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: STORAGE_KEY,
      currentDataVersion: 1,
      migrators: [
        {
          migratorFunc: (oldData: TimerStateSchemas[0]): TimerStateSchemas[1] => {
            return {
              dataVersion: 1,
              remainingSeconds: oldData.remainingSeconds,
              isRunning: oldData.isRunning,
              stage: oldData.stage,
              focusSessionsCompleted: oldData.numOfPomodoriCompleted
            }
          },
          oldDataVersion: undefined
        }
      ]
    })
  }

  async get(): Promise<TimerState | null> {
    const result = await this.storageWrapper.get()
    if (!result) {
      return result
    }
    return deserializeTimerState(result)
  }

  async save(timerState: TimerState): Promise<void> {
    return this.storageWrapper.set(serializeTimerState(timerState))
  }
}
