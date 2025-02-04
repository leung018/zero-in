import type { BrowsingRules } from '../domain/browsing_rules'
import type { WebsiteRedirectService } from '../domain/redirect'

export class ChromeRedirectService implements WebsiteRedirectService {
  async activateRedirect(browsingRules: BrowsingRules, targetUrl: string): Promise<void> {
    // May make more sense to chain the promise of redirectAllActiveTabs after redirectFutureRequests.
    // However, it has bug when promise that involved chrome.updateDynamicRules is called first before another chained promise. The redirectAllActiveTabs cannot be triggered sometimes in that case.

    return this.redirectAllActiveTabs(browsingRules, targetUrl).then(() => {
      return this.redirectFutureRequests(browsingRules, targetUrl)
    })
  }

  async deactivateRedirect(): Promise<void> {
    return chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1]
    })
  }

  private async redirectFutureRequests(
    browsingRules: BrowsingRules,
    targetUrl: string
  ): Promise<void> {
    const rule: chrome.declarativeNetRequest.Rule = {
      id: 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          url: targetUrl
        }
      },
      condition: {
        requestDomains: [...browsingRules.blockedDomains],
        resourceTypes: ['main_frame']
      }
    }

    return chrome.declarativeNetRequest.updateDynamicRules({
      addRules: browsingRules.blockedDomains.length > 0 ? [rule] : undefined,
      removeRuleIds: [1]
    })
  }

  private async redirectAllActiveTabs(
    browsingRules: BrowsingRules,
    targetUrl: string
  ): Promise<void> {
    const tabs = await this.queryAllTabs()
    tabs.forEach((tab) => {
      if (tab && tab.url && tab.id) {
        const url = new URL(tab.url)

        for (const domain of browsingRules.blockedDomains) {
          // FIXME: This is not a good way to check the domain. It should be more strict.
          if (url.hostname.includes(domain)) {
            chrome.tabs.update(tab.id, {
              url: targetUrl
            })
          }
        }
      }
    })
  }

  private async queryAllTabs() {
    return chrome.tabs.query({})
  }
}
