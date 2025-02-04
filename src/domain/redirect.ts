import type { BrowsingRules } from './browsing_rules'

export interface WebsiteRedirectService {
  /**
   * This method will activate the redirect to the target URL according to the browsing rules. Any old activated browsing rules will be discarded.
   */
  activateRedirect(browsingRules: BrowsingRules, targetUrl: string): Promise<void>

  deactivateRedirect(): Promise<void>
}

export class FakeWebsiteRedirectService implements WebsiteRedirectService {
  private activatedRedirectRules: {
    browsingRules: BrowsingRules
    targetUrl: string
  } | null = null

  async activateRedirect(browsingRules: BrowsingRules, targetUrl: string): Promise<void> {
    this.activatedRedirectRules = { browsingRules, targetUrl }
  }

  getActivatedRedirectRules() {
    return this.activatedRedirectRules ? { ...this.activatedRedirectRules } : null
  }

  async deactivateRedirect(): Promise<void> {
    this.activatedRedirectRules = null
  }
}
