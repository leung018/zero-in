import type { BlockingTimerIntegration } from '.'
import { ChromeStorageProvider } from '../../chrome/storage'
import config from '../../config'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'

const STORAGE_KEY = 'blockingTimerIntegration'

export class BlockingTimerIntegrationStorageService {
  static create(): BlockingTimerIntegrationStorageService {
    return new BlockingTimerIntegrationStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new BlockingTimerIntegrationStorageService(new FakeStorage())
  }

  private storageWrapper: StorageWrapper<BlockingTimerIntegration>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: STORAGE_KEY,
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
