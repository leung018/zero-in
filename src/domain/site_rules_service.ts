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
