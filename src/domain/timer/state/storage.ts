import type { TimerState } from '.'
import { StorageInterface } from '../../../infra/storage/interface'
import { LocalStorageWrapper } from '../../../infra/storage/local_storage_wrapper'
import { StorageManager } from '../../../infra/storage/manager'
import { type TimerStateSchemas } from './schema'
import { deserializeTimerState, serializeTimerState } from './serialize'

export class TimerStateStorageService {
  static readonly STORAGE_KEY = 'timerState'

  static create() {
    return new TimerStateStorageService(LocalStorageWrapper.create())
  }

  static createFake(storage = LocalStorageWrapper.createFake()) {
    return new TimerStateStorageService(storage)
  }

  private storageManager: StorageManager<TimerStateSchemas[2]>

  private constructor(storage: StorageInterface) {
    this.storageManager = new StorageManager({
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
    const result = await this.storageManager.get()
    if (result == null) {
      return null
    }
    return deserializeTimerState(result)
  }

  async save(timerState: TimerState): Promise<void> {
    return this.storageManager.set(serializeTimerState(timerState))
  }
}
