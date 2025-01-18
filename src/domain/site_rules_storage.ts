import { ChromeLocalStorageWrapper } from '../chrome/local_storage'
import { SiteRules } from './site_rules'

export interface SiteRulesStorageService {
  save(siteRules: SiteRules): Promise<void>
  get(): Promise<SiteRules>
}

export class SiteRulesStorageServiceImpl implements SiteRulesStorageService {
  static createFake(): SiteRulesStorageServiceImpl {
    return new SiteRulesStorageServiceImpl(ChromeLocalStorageWrapper.createFake())
  }

  static create(): SiteRulesStorageServiceImpl {
    return new SiteRulesStorageServiceImpl(ChromeLocalStorageWrapper.create())
  }

  private storageWrapper: ChromeLocalStorageWrapper

  private constructor(chromeLocalStorageWrapper: ChromeLocalStorageWrapper) {
    this.storageWrapper = chromeLocalStorageWrapper
  }

  async save(siteRules: SiteRules): Promise<void> {
    return this.storageWrapper.set({ siteRules: serializeSiteRules(siteRules) })
  }

  async get(): Promise<SiteRules> {
    return this.storageWrapper.get('siteRules').then((result: any) => {
      if (result.siteRules) {
        return deserializeSiteRules(result.siteRules)
      }

      return new SiteRules()
    })
  }
}

type SerializedSiteRules = {
  blockedDomains: ReadonlyArray<string>
}

function serializeSiteRules(siteRules: SiteRules): SerializedSiteRules {
  return {
    blockedDomains: siteRules.blockedDomains
  }
}

function deserializeSiteRules(data: SerializedSiteRules): SiteRules {
  return new SiteRules(data)
}
