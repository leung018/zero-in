import type { BrowsingRules } from '.'

export interface WebsiteRedirectService {
  /**
   * This method will activate the redirect to the target URL according to the browsing rules. Any old activated browsing rules will be discarded.
   */
  activateRedirect(browsingRules: BrowsingRules, targetUrl: string): Promise<void>
}
