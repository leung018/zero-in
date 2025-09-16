import type { TimerBasedBlocking } from '.'
import config from '../../config'
import { AdaptiveStorageProvider } from '../../infra/storage/adaptive'
import { StorageInterface, StorageService } from '../../infra/storage/interface'
import { StorageKey } from '../../infra/storage/key'
import { LocalStorageWrapper } from '../../infra/storage/local_storage'
import { StorageManager } from '../../infra/storage/manager'
import { TimerBasedBlockingSchemas } from './schema'
import { deserializeTimerBasedBlocking, serializeTimerBasedBlocking } from './serialize'

export class TimerBasedBlockingStorageService implements StorageService<TimerBasedBlocking> {
  static readonly STORAGE_KEY: StorageKey = 'blockingTimerIntegration'

  static create(): TimerBasedBlockingStorageService {
    return new TimerBasedBlockingStorageService(AdaptiveStorageProvider.create())
  }

  static createFake() {
    return new TimerBasedBlockingStorageService(LocalStorageWrapper.createFake())
  }

  private storageManager: StorageManager<TimerBasedBlockingSchemas[1]>

  constructor(storage: StorageInterface) {
    this.storageManager = StorageManager.create({
      storage,
      key: TimerBasedBlockingStorageService.STORAGE_KEY,
      currentDataVersion: 1,
      migrators: [
        {
          oldDataVersion: undefined,
          migratorFunc: (oldData: TimerBasedBlockingSchemas[0]): TimerBasedBlockingSchemas[1] => {
            return {
              dataVersion: 1,
              pauseBlockingDuringBreaks: oldData.shouldPauseBlockingDuringBreaks,
              pauseBlockingWhenTimerNotRunning: false
            }
          }
        }
      ]
    })
  }

  async get(): Promise<TimerBasedBlocking> {
    const result = await this.storageManager.get()
    if (result) {
      return deserializeTimerBasedBlocking(result)
    }
    return config.getDefaultTimerBasedBlocking()
  }

  async save(setting: TimerBasedBlocking) {
    return this.storageManager.set(serializeTimerBasedBlocking(setting))
  }
}
