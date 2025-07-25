import { BrowsingRules } from '.'
import { BrowserStorageProvider } from '../../infra/browser/storage'
import { FakeStorage, StorageManager, type Storage } from '../../infra/storage'
import {
  deserializeBrowsingRules,
  serializeBrowsingRules,
  type SerializedBrowsingRules
} from './serialize'

export class BrowsingRulesStorageService {
  static readonly STORAGE_KEY = 'browsingRules'

  static createFake(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(new FakeStorage())
  }

  static create(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(BrowserStorageProvider.getLocalStorage())
  }

  private storageManager: StorageManager<SerializedBrowsingRules>

  private constructor(storage: Storage) {
    this.storageManager = new StorageManager({
      storage,
      key: BrowsingRulesStorageService.STORAGE_KEY,
      migrators: []
    })
  }

  async save(browsingRules: BrowsingRules): Promise<void> {
    return this.storageManager.set(serializeBrowsingRules(browsingRules))
  }

  async get(): Promise<BrowsingRules> {
    const result = await this.storageManager.get()
    if (result) {
      return deserializeBrowsingRules(result)
    }
    return new BrowsingRules()
  }
}
