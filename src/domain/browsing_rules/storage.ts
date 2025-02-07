import { ChromeLocalStorageFactory, type StorageHandler } from '../../chrome/local_storage'
import { BrowsingRules } from '.'

export class BrowsingRulesStorageService {
  static createFake(): BrowsingRulesStorageService {
    return new BrowsingRulesStorageService(ChromeLocalStorageFactory.createFakeStorageHandler())
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

type SerializedBrowsingRules = {
  blockedDomains: ReadonlyArray<string>
}

function serializeBrowsingRules(browsingRules: BrowsingRules): SerializedBrowsingRules {
  return {
    blockedDomains: browsingRules.blockedDomains
  }
}

function deserializeBrowsingRules(data: SerializedBrowsingRules): BrowsingRules {
  return new BrowsingRules(data)
}
