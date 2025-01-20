import type { BrowsingRules } from '.'

export interface WebsiteRedirectService {
  activateRedirect(browsingRules: BrowsingRules, targetUrl: string): Promise<void>
}
