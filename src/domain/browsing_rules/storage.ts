import { ChromeStorageProvider } from '../../infra/chrome/storage'
import { FakeStorage, StorageWrapper, type Storage } from '../../infra/storage'
import { BrowsingRules } from '.'
import {
  deserializeBrowsingRules,
  serializeBrowsingRules,
  type SerializedBrowsingRules
} from './serialize'

const STORAGE_KEY = 'browsingRules'

export class BrowsingRulesStorageService {
  static createFake(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(new FakeStorage())
  }

  static create(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(ChromeStorageProvider.getLocalStorage())
  }

  private storageWrapper: StorageWrapper<SerializedBrowsingRules>

  private constructor(storage: Storage) {
    this.storageWrapper = new StorageWrapper({
      storage,
      key: STORAGE_KEY,
      migrators: []
    })
  }

  async save(browsingRules: BrowsingRules): Promise<void> {
    return this.storageWrapper.set(serializeBrowsingRules(browsingRules))
  }

  async get(): Promise<BrowsingRules> {
    const result = await this.storageWrapper.get()
    if (result) {
      return deserializeBrowsingRules(result)
    }
    return new BrowsingRules()
  }
}
