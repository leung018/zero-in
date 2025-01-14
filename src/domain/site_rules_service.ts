import type { SiteRules } from './site_rules'

export interface SiteRulesService {
  save(siteRules: SiteRules): Promise<void>
}
