import { ChromeStorageProvider } from '../../chrome/storage'
import { FakeStorage, type Storage } from '../../infra/storage'
import { BrowsingRules } from '.'
import { deserializeBrowsingRules, serializeBrowsingRules } from './serialize'

const STORAGE_KEY = 'browsingRules'

export class BrowsingRulesStorageService {
  static createFake(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(new FakeStorage())
  }

  static create(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(ChromeStorageProvider.getLocalStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async save(browsingRules: BrowsingRules): Promise<void> {
    return this.storage.set({ [STORAGE_KEY]: serializeBrowsingRules(browsingRules) })
  }

  async get(): Promise<BrowsingRules> {
    const result = await this.storage.get(STORAGE_KEY)
    if (result[STORAGE_KEY]) {
      return deserializeBrowsingRules(result[STORAGE_KEY])
    }
    return new BrowsingRules()
  }
}
