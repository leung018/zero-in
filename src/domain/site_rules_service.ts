import type { SiteRules } from './site_rules'

declare const chrome: any // FIXME: Find a way to type this properly and also fix the type hint related to it.
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

export class ChromeLocalStorageSiteRulesService implements SiteRulesService {
  async save(siteRules: SiteRules): Promise<void> {
    await chrome.storage.local.set({ siteRules })
  }

  async getSiteRules(): Promise<SiteRules> {
    return chrome.storage.local.get('siteRules').then((result: any) => {
      return result.siteRules
    })
  }
}
