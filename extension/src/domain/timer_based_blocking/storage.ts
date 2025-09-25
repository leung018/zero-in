import type { TimerBasedBlockingRules } from '.'
import { StorageInterface, StorageService } from '../../../../shared/src/infra/storage/interface'
import config from '../../config'
import { StorageKey } from '../../infra/storage/key'
import { StorageManager } from '../../infra/storage/manager'
import { TimerBasedBlockingRulesSchemas } from './schema'
import { deserializeTimerBasedBlockingRules, serializeTimerBasedBlockingRules } from './serialize'

export class TimerBasedBlockingRulesStorageService
  implements StorageService<TimerBasedBlockingRules>
{
  static readonly STORAGE_KEY: StorageKey = 'blockingTimerIntegration'

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
