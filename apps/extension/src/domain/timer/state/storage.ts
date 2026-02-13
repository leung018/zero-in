import { FakeObservableStorage } from '@zero-in/shared/infra/storage/fake'
import {
  ObservableStorage,
  StorageInterface,
  StorageService
} from '@zero-in/shared/infra/storage/interface'
import { StorageKey } from '@zero-in/shared/infra/storage/key'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { StorageManager } from '@zero-in/shared/infra/storage/manager'
import { getDateAfter } from '@zero-in/shared/utils/date'
import { AdaptiveStorageProvider } from '../../../infra/storage/adaptive'
import { Duration } from '../duration'
import { TimerInternalState } from './internal'
import { type TimerStateSchemas } from './schema'
import { deserializeTimerState, serializeTimerState } from './serialize'

export class TimerStateStorageService implements StorageService<TimerInternalState> {
  static readonly STORAGE_KEY: StorageKey = 'timerState'

  static create() {
    return new TimerStateStorageService(AdaptiveStorageProvider.create())
  }

  static createFake() {
    return new TimerStateStorageService(LocalStorageWrapper.createFake())
  }

  static createObservableFake() {
    return new TimerStateStorageService(FakeObservableStorage.create())
  }

  private storageManager: StorageManager<TimerStateSchemas[5]>

  private unsubscribes: (() => void)[] = []

  constructor(storage: ObservableStorage | StorageInterface) {
    this.storageManager = StorageManager.create({
      storage,
      key: TimerStateStorageService.STORAGE_KEY,
      currentDataVersion: 5,
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
        },
        {
          oldDataVersion: 2,
          migratorFunc: (oldData: TimerStateSchemas[2]): TimerStateSchemas[3] => {
            const now = new Date()
            return {
              dataVersion: 3,
              pausedAt: oldData.isRunning ? null : now.getTime(),
              endAt: getDateAfter({
                from: now,
                duration: new Duration({ milliseconds: oldData.remainingMilliseconds })
              }).getTime(),
              stage: oldData.stage,
              focusSessionsCompleted: oldData.focusSessionsCompleted
            }
          }
        },
        {
          oldDataVersion: 3,
          migratorFunc: (oldData: TimerStateSchemas[3]): TimerStateSchemas[4] => {
            return {
              ...oldData,
              dataVersion: 4,
              sessionStartTime: null
            }
          }
        },
        {
          oldDataVersion: 4,
          migratorFunc: (oldData: TimerStateSchemas[4]): TimerStateSchemas[5] => {
            return {
              ...oldData,
              dataVersion: 5,
              timerId: ''
            }
          }
        }
      ]
    })
  }

  async get(): Promise<TimerInternalState | null> {
    const result = await this.storageManager.get()
    if (result == null) {
      return null
    }
    return deserializeTimerState(result)
  }

  async save(timerState: TimerInternalState): Promise<void> {
    return this.storageManager.set(serializeTimerState(timerState))
  }

  async onChange(callback: (state: TimerInternalState) => void): Promise<void> {
    const unsubscribe = await this.storageManager.onChange((data) => {
      callback(deserializeTimerState(data))
    })
    this.unsubscribes.push(unsubscribe)
  }

  unsubscribeAll() {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe())
    this.unsubscribes = []
  }
}
