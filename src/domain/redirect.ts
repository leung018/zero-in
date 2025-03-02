import type { BrowsingRules } from './browsing_rules'

export interface WebsiteRedirectService {
  /**
   * This method will activate the redirect to the target URL according to the browsing rules. Any old activated browsing rules will be discarded.
   */
  activateRedirect(browsingRules: BrowsingRules): Promise<void>

  deactivateRedirect(): Promise<void>
}

export class FakeWebsiteRedirectService implements WebsiteRedirectService {
  private activatedBrowsingRules: BrowsingRules | null = null

  async activateRedirect(browsingRules: BrowsingRules): Promise<void> {
    this.activatedBrowsingRules = browsingRules
  }

  getActivatedBrowsingRules() {
    return this.activatedBrowsingRules ? { ...this.activatedBrowsingRules } : null
  }

  async deactivateRedirect(): Promise<void> {
    this.activatedBrowsingRules = null
  }
}
