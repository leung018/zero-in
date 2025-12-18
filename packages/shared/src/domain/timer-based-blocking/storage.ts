import { StorageInterface, StorageService } from '@zero-in/shared/infra/storage/interface'
import { StorageKey } from '@zero-in/shared/infra/storage/key'
import { LocalStorageWrapper } from '@zero-in/shared/infra/storage/local-storage/index'
import { StorageManager } from '@zero-in/shared/infra/storage/manager'
import type { TimerBasedBlockingRules } from '.'
import config from '../../config'
import { TimerBasedBlockingRulesSchemas } from './schema'
import { deserializeTimerBasedBlockingRules, serializeTimerBasedBlockingRules } from './serialize'

export class TimerBasedBlockingRulesStorageService
  implements StorageService<TimerBasedBlockingRules>
{
  static readonly STORAGE_KEY: StorageKey = 'blockingTimerIntegration'

  static createFake() {
    return new TimerBasedBlockingRulesStorageService(LocalStorageWrapper.createFake())
  }

  private storageManager: StorageManager<TimerBasedBlockingRulesSchemas[1]>

  constructor(storage: StorageInterface) {
    this.storageManager = StorageManager.create({
      storage,
      key: TimerBasedBlockingRulesStorageService.STORAGE_KEY,
      currentDataVersion: 1,
      migrators: [
        {
          oldDataVersion: undefined,
          migratorFunc: (
            oldData: TimerBasedBlockingRulesSchemas[0]
          ): TimerBasedBlockingRulesSchemas[1] => {
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

  async get(): Promise<TimerBasedBlockingRules> {
    const result = await this.storageManager.get()
    if (result) {
      return deserializeTimerBasedBlockingRules(result)
    }
    return config.getDefaultTimerBasedBlockingRules()
  }

  async save(setting: TimerBasedBlockingRules) {
    return this.storageManager.set(serializeTimerBasedBlockingRules(setting))
  }
}
