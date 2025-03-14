import { ChromeStorageFactory } from '../../chrome/storage'
import { FakeStorage, type Storage } from '../../infra/storage'
import { BrowsingRules } from '.'
import { deserializeBrowsingRules, serializeBrowsingRules } from './serialize'

export class BrowsingRulesStorageService {
  static createFake(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(new FakeStorage())
  }

  static create(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(ChromeStorageFactory.createLocalStorage())
  }

  private storage: Storage

  private constructor(storage: Storage) {
    this.storage = storage
  }

  async save(browsingRules: BrowsingRules): Promise<void> {
    return this.storage.set({ browsingRules: serializeBrowsingRules(browsingRules) })
  }

  async get(): Promise<BrowsingRules> {
    return this.storage.get('browsingRules').then((result: any) => {
      if (result.browsingRules) {
        return deserializeBrowsingRules(result.browsingRules)
      }

      return new BrowsingRules()
    })
  }
}
