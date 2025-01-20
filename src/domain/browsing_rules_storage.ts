import { ChromeLocalStorageWrapper } from '../chrome/local_storage'
import { BrowsingRules } from './browsing_rules'

export interface BrowsingRulesStorageService {
  save(browsingRules: BrowsingRules): Promise<void>
  get(): Promise<BrowsingRules>
}

export class BrowsingRulesStorageServiceImpl implements BrowsingRulesStorageService {
  static createFake(): BrowsingRulesStorageServiceImpl {
    return new BrowsingRulesStorageServiceImpl(ChromeLocalStorageWrapper.createFake())
  }

  static create(): BrowsingRulesStorageServiceImpl {
    return new BrowsingRulesStorageServiceImpl(ChromeLocalStorageWrapper.create())
  }

  private storageWrapper: ChromeLocalStorageWrapper

  private constructor(chromeLocalStorageWrapper: ChromeLocalStorageWrapper) {
    this.storageWrapper = chromeLocalStorageWrapper
  }

  async save(browsingRules: BrowsingRules): Promise<void> {
    return this.storageWrapper.set({ browsingRules: serializeBrowsingRules(browsingRules) })
  }

  async get(): Promise<BrowsingRules> {
    return this.storageWrapper.get('browsingRules').then((result: any) => {
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
