import { ChromeLocalStorageFactory } from '../../chrome/storage'
import { FakeChromeLocalStorage, type StorageHandler } from '../../infra/storage'
import { BrowsingRules } from '.'
import { deserializeBrowsingRules, serializeBrowsingRules } from './serialize'

export class BrowsingRulesStorageService {
  static createFake(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(new FakeChromeLocalStorage())
  }

  static create(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(ChromeLocalStorageFactory.createStorageHandler())
  }

  private storageHandler: StorageHandler

  private constructor(storageHandler: StorageHandler) {
    this.storageHandler = storageHandler
  }

  async save(browsingRules: BrowsingRules): Promise<void> {
    return this.storageHandler.set({ browsingRules: serializeBrowsingRules(browsingRules) })
  }

  async get(): Promise<BrowsingRules> {
    return this.storageHandler.get('browsingRules').then((result: any) => {
      if (result.browsingRules) {
        return deserializeBrowsingRules(result.browsingRules)
      }

      return new BrowsingRules()
    })
  }
}
