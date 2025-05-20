import type { BlockingTimerIntegration } from '.'
import config from '../../config'
import { ChromeStorageProvider } from '../../infra/browser/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'
import type { SerializedBlockingTimerIntegration } from './serialize'

export class BlockingTimerIntegrationStorageService {
  static readonly STORAGE_KEY = 'blockingTimerIntegration'

  static create(): BlockingTimerIntegrationStorageService {
    return new BlockingTimerIntegrationStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new BlockingTimerIntegrationStorageService(new FakeStorage())
  }

  private storageWrapper: StorageWrapper<SerializedBlockingTimerIntegration>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: BlockingTimerIntegrationStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async get(): Promise<BlockingTimerIntegration> {
    const result = await this.storageWrapper.get()
    if (result) {
      return result
    }
    return config.getDefaultBlockingTimerIntegration()
  }

  async save(setting: BlockingTimerIntegration) {
    return this.storageWrapper.set(setting)
  }
}
