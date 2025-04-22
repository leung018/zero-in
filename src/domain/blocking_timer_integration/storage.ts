import type { BlockingTimerIntegration } from '.'
import { ChromeStorageProvider } from '../../chrome/storage'
import config from '../../config'
import { FakeStorage, type Storage } from '../../infra/storage'

const STORAGE_KEY = 'blockingTimerIntegration'

export class BlockingTimerIntegrationStorageService {
  static create(): BlockingTimerIntegrationStorageService {
    return new BlockingTimerIntegrationStorageService(ChromeStorageProvider.getLocalStorage())
  }

  static createFake() {
    return new BlockingTimerIntegrationStorageService(new FakeStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async get(): Promise<BlockingTimerIntegration> {
    const result = await this.storage.get(STORAGE_KEY)
    if (result[STORAGE_KEY]) {
      return result[STORAGE_KEY]
    }
    return config.getDefaultBlockingTimerIntegration()
  }

  async save(setting: BlockingTimerIntegration) {
    return this.storage.set({
      [STORAGE_KEY]: setting
    })
  }
}
