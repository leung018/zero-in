import type { BlockingTimerIntegration } from '.'
import config from '../../config'
import { BrowserStorageProvider } from '../../infra/browser/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'
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

  private storageWrapper: StorageWrapper<BlockingTimerIntegrationSchemas[1]>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
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
    const result = await this.storageWrapper.get()
    if (result) {
      return deserializeBlockingTimerIntegration(result)
    }
    return config.getDefaultBlockingTimerIntegration()
  }

  async save(setting: BlockingTimerIntegration) {
    return this.storageWrapper.set(serializeBlockingTimerIntegration(setting))
  }
}
