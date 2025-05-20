import type { TimerState } from '.'
import { ChromeStorageProvider } from '../../../infra/browser/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../../infra/storage'
import { deserializeTimerState, serializeTimerState, type TimerStateSchemas } from './serialize'

export class TimerStateStorageService {
  static readonly STORAGE_KEY = 'timerState'

  static create() {
    return new TimerStateStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake(storage = new FakeStorage()) {
    return new TimerStateStorageService(storage)
  }

  private storageWrapper: StorageWrapper<TimerStateSchemas[2]>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: TimerStateStorageService.STORAGE_KEY,
      currentDataVersion: 2,
      migrators: [
        {
          oldDataVersion: undefined,
          migratorFunc: (oldData: TimerStateSchemas[0]): TimerStateSchemas[1] => {
            return {
              dataVersion: 1,
              remainingSeconds: oldData.remainingSeconds,
              isRunning: oldData.isRunning,
              stage: oldData.stage,
              focusSessionsCompleted: oldData.numOfPomodoriCompleted
            }
          }
        },
        {
          oldDataVersion: 1,
          migratorFunc: (oldData: TimerStateSchemas[1]): TimerStateSchemas[2] => {
            return {
              ...oldData,
              dataVersion: 2,
              remainingMilliseconds: oldData.remainingSeconds * 1000
            }
          }
        }
      ]
    })
  }

  async get(): Promise<TimerState | null> {
    const result = await this.storageWrapper.get()
    if (result == null) {
      return null
    }
    return deserializeTimerState(result)
  }

  async save(timerState: TimerState): Promise<void> {
    return this.storageWrapper.set(serializeTimerState(timerState))
  }
}
