import type { BlockingTimerIntegration } from '.'
import config from '../../config'
import { BrowserStorageProvider } from '../../infra/browser/storage'
import { FakeStorage, StorageManager, type Storage } from '../../infra/storage'
import { BlockingTimerIntegrationSchemas } from './schema'
import { deserializeBlockingTimerIntegration, serializeBlockingTimerIntegration } from './serialize'

export class BlockingTimerIntegrationStorageService {
  static readonly STORAGE_KEY = 'blockingTimerIntegration'

  static create(): BlockingTimerIntegrationStorageService {
    return new BlockingTimerIntegrationStorageService(BrowserStorageProvider.getLocalStorage())
  }

  static createFake(storage = new FakeStorage()) {
    return new BlockingTimerIntegrationStorageService(storage)
  }

  private storageManager: StorageManager<BlockingTimerIntegrationSchemas[1]>

  private constructor(storage: Storage) {
    this.storageManager = new StorageManager({
      storage,
      key: BlockingTimerIntegrationStorageService.STORAGE_KEY,
      currentDataVersion: 1,
      migrators: [
        {
          oldDataVersion: undefined,
          migratorFunc: (
            oldData: BlockingTimerIntegrationSchemas[0]
          ): BlockingTimerIntegrationSchemas[1] => {
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

  async get(): Promise<BlockingTimerIntegration> {
    const result = await this.storageManager.get()
    if (result) {
      return deserializeBlockingTimerIntegration(result)
    }
    return config.getDefaultBlockingTimerIntegration()
  }

  async save(setting: BlockingTimerIntegration) {
    return this.storageManager.set(serializeBlockingTimerIntegration(setting))
  }
}
