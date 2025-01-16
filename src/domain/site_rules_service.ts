import { ChromeLocalStorageWrapper } from '../chrome/local_storage'
import type { SiteRules } from './site_rules'

export interface SiteRulesService {
  save(siteRules: SiteRules): Promise<void>
  getSiteRules(): Promise<SiteRules>
}

export class InMemorySiteRulesService implements SiteRulesService {
  private siteRules: SiteRules = { blockedDomains: [] }

  async save(siteRules: SiteRules): Promise<void> {
    this.siteRules = siteRules
  }

  async getSiteRules(): Promise<SiteRules> {
    return this.siteRules
  }
}

export class SiteRulesServiceImpl implements SiteRulesService {
  static createFake(): SiteRulesServiceImpl {
    return new SiteRulesServiceImpl(ChromeLocalStorageWrapper.createFake())
  }

  static create(): SiteRulesServiceImpl {
    return new SiteRulesServiceImpl(ChromeLocalStorageWrapper.create())
  }

  private storageWrapper: ChromeLocalStorageWrapper

  private constructor(chromeLocalStorageWrapper: ChromeLocalStorageWrapper) {
    this.storageWrapper = chromeLocalStorageWrapper
  }

  async save(siteRules: SiteRules): Promise<void> {
    return this.storageWrapper.set({ siteRules })
  }

  async getSiteRules(): Promise<SiteRules> {
    return this.storageWrapper.get('siteRules').then((result: any) => {
      return result.siteRules || { blockedDomains: [] }
    })
  }
}
